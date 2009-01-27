#! /usr/bin/perl -w

use strict;

use Data::Dumper;
use lib '../perl';
use Template;
use Storable;

my $BASE_DIR = '..';
my $JS_DIR = "$BASE_DIR/src/js";
my $API_DIR = "$BASE_DIR/jsdoc/api";
my $GEN_DIR = "$BASE_DIR/jsdoc/genapi";
my $TT_DIR = "$API_DIR/tt";
my $OBJECTS_FILE = "$API_DIR/objects.storable";
my $INDEX_FILE = "$GEN_DIR/index.js";

my $OBJECTS_HASH = retrieve($OBJECTS_FILE);

use Encode;
use File::Basename;
use DynarchLIB::XML_TreeBuilder;
use JSON;

my $TT = Template->new(
    INCLUDE_PATH => $TT_DIR,
    PRE_CHOMP    => 1,
    FILTERS      => { xml => \&tt_XML_filter },
    VARIABLES    => {
        objects_hash => $OBJECTS_HASH,
        get_overrides => \&get_overrides,
    }
);

my @files = <$API_DIR/*.xml>;
foreach my $file (@files) {
    doFile($file);
}

# generate outline
{
    my $out;
    my $genobj = [];
    $TT->process('outline.tt', { genobj => $genobj }, \$out)
      or die($TT->error);
    open OUTLINE, "> $GEN_DIR/outline.xml";
    print OUTLINE $out;
    close OUTLINE;

    my $json = {
        objects         => [],
        static_methods  => [],
        object_methods  => [],
        events          => []
    };

    foreach my $file (@$genobj) {
        (my $objname = $file) =~ s{api://(.*?)\.xml}{$1};
        my $obj = $OBJECTS_HASH->{$objname};
        if ($obj) {
            push @{$json->{objects}}, $objname;
            my @a;

            @a = @{$obj->{static_methods}};
            @a = map {{ o => $objname, n => $_->{name} }} @a;
            push @{$json->{static_methods}}, @a;

            @a = @{$obj->{object_methods}};
            @a = map {{ o => $objname, n => $_->{name} }} @a;
            push @{$json->{object_methods}}, @a;
        }
    }

    my $j = JSON->new->utf8;
    $json = $j->encode($json);
    open OUT, ">$INDEX_FILE";
    print OUT $json;
    close OUT;
}

sub tt_XML_filter {
    my $text = shift;
    $text =~ s/</&#x3c/g;
    $text =~ s/>/&#x3e/g;
    return $text;
}

sub get_overrides {
    my ($object, $method) = @_;
    my $p = $OBJECTS_HASH->{$object};
    while ($p) {
        my $base = $p->{base};
        if ($base) {
            $base = $OBJECTS_HASH->{$base};
            if ($base && exists $base->{methods_hash}{$method->{name}}) {
                # print STDERR "Found $base->{methods_hash}{$method->{name}}{name} in $base->{name}\n";
                return {
                    object => $base,
                    method => $base->{methods_hash}{$method->{name}}
                };
            }
        }
        $p = $base;
    }
    return undef;
}

sub doFile {
    my ($file) = @_;
    my $xmlfile = "$file";

    print STDERR "Processing $file\n";

    my $tree = DynarchLIB::XML_TreeBuilder->new;
    {
        open FILE, '<', $xmlfile;
        local $/ = undef;
        my $content = <FILE>;
        close FILE;
        $content = encode('utf8', $content);
        $content =~ s/^\s+//;
        $content =~ s/\s+$//;
        $tree->parse($content);
    }
    $tree->eof;

    my $fileinfo = $tree->look_down(_tag => 'fileinfo');

    my $show = $tree->attr('show');
    # print STDERR "Processing $file, show = " . ($show ? 1 : 0) . "\n";

    my @objects = $tree->look_down(_tag => 'object');
    foreach my $obj (@objects) {
        if (!$obj->attr('undoc')) {
            if ($fileinfo) {
                doObject($obj, getXML($obj, undef, $fileinfo));
            } else {
                doObject($obj);
            }
            $obj = $OBJECTS_HASH->{$obj->attr('name')};
            $obj->{show} = $show;
        }
    }
}

sub cmp_alphainternal {
    my ($a, $b) = @_;
    my $an = lc $a->{name};
    my $bn = lc $b->{name};
    if ($a->{internal} && $b->{internal} || (!$a->{internal} && !$b->{internal})) {
        return $an lt $bn ? -1 : ($an eq $bn ? 0 : 1);
    }
    if ($a->{internal}) {
        return 1;
    }
    if ($b->{internal}) {
        return -1;
    }
};

sub doObject {
    my ($obj, $fileinfo) = @_;
    my $output = "$GEN_DIR/" . $obj->attr('name') . '.xml';

    my $tmp;

    $obj->{_code_samples} = [];

    ($tmp) = $obj->look_down(_tag => 'static-methods');
    my @static_methods;
    if ($tmp) {
        @static_methods = $tmp->look_down(_tag => 'method');
    }

    my @object_methods;
    ($tmp) = $obj->look_down(_tag => 'object-methods');
    if ($tmp) {
        @object_methods = $tmp->look_down(_tag => 'method');
    }

    my @events;
    ($tmp) = $obj->look_down(_tag => 'events');
    if ($tmp) {
        @events = $tmp->look_down(_tag => 'event');
    }

    my ($constructor) = $obj->look_down(_tag => 'constructor');

    @static_methods = map { doMethod($obj, 'static_method', $_) } @static_methods;
    @object_methods = map { doMethod($obj, 'object_method', $_) } @object_methods;
    @events = map { doEvent($obj, $_) } @events;

    @events = sort { cmp_alphainternal($a, $b) } @events;
    @static_methods = sort { cmp_alphainternal($a, $b) } @static_methods;
    @object_methods = sort { cmp_alphainternal($a, $b) } @object_methods;

    $constructor = doMethod($obj, 'constructor', $constructor);

    my $out;
    $TT->process('xmlgen.tt', {
        object          => $obj->attr('name'),
        base            => $obj->attr('base'),
        base_object     => ( $obj->attr('base')
                               ? $OBJECTS_HASH->{$obj->attr('base')}
                                 : undef ),
        file_info       => $fileinfo,
        object_node     => $obj,
        internal        => $obj->attr('internal'),
        static_methods  => \@static_methods,
        object_methods  => \@object_methods,
        events          => \@events,
        constructor     => $constructor,
        code_samples    => $obj->{_code_samples},
    }, \$out)
      or die($TT->error);

    open OUT, ">", $output;
    print OUT $out;
    close OUT;
}

sub doEvent {
    my ($obj, $event) = @_;

    my @params = $event->look_down(_tag => 'param');
    @params = map { doParam($obj, $event, $_) } @params;

    my ($doc) = $event->look_down(_tag => 'doc');
    if ($doc) {
        $doc = doDoc($obj, $event, $doc);
    }

    my $ttvar = {
        name    => $event->attr('name'),
        params  => \@params,
        doc     => $doc,
        type    => 'object_event',
    };
    return $ttvar;
}

sub doMethod {
    my ($obj, $type, $method) = @_;

    my @params = $method->look_down(_tag => 'param');
    @params = map { doParam($obj, $method, $_) } @params;

    my ($return) = $method->look_down(_tag => 'return');
    if ($return) {
        $return = doParam($obj, $method, $return);
        # print STDERR $return->{doc}, "\n";
    }

    my ($doc) = $method->look_down(_tag => 'doc');
    if (!$doc && $type eq 'constructor') {
        $doc = $method;
    }
    if ($doc) {
        $doc = doDoc($obj, $method, $doc);
    }

    my $suffix = '';
    my @pnames = (map { $_->{name} } @params);
    my $varargs = $method->attr('varargs') && $method->attr('varargs') ne 'no' ? 1 : 0;
    if ($varargs) {
        push @pnames, '…';
    }
    $suffix = join(', ', @pnames);
    $suffix = " ($suffix)";

    my $ttvar = {
        type          => $type,
        name          => $method->attr('name'),
        undoc         => $method->attr('undoc') ? 1 : 0,
        internal      => $method->attr('internal') ? 1 : 0,
        object        => $obj->attr('name'),
        object_node   => $obj,
        params        => \@params,
        linear_params => $method->attr('params'),
        suffix        => $suffix,
        return        => $return,
        doc           => $doc,
        varargs       => $varargs,
    };

    return $ttvar;
}

sub doParam {
    my ($obj, $method, $param) = @_;
    my ($doc) = $param->look_down(_tag => 'doc');
    if (!$doc) {
        $doc = $param;
    }
    $doc = doDoc($obj, $method, $doc);
    my $default = $param->attr('default');
    $default =~ s{¶}{<br/>}g
      if $default;
    return {
        name      => $param->attr('name'),
        undoc     => $param->attr('undoc'),
        internal  => $param->attr('internal'),
        type      => $param->attr('type'),
        optional  => $param->attr('optional'),
        default   => $default,
        doc       => $doc,
    };
}

sub doDoc {
    my ($obj, $method, $doc) = @_;
    # FIXME: do JS, CSS, paragraphs, etc.
#     $doc->objectify_text;
#     my (@texts) = $doc->look_down(_tag => '~text');
#     foreach my $i (@texts) {
#         my $text = $i->attr('text');
#         my @paragraphs = split(/[ \t]*\n\n+[ \t]*/, $text);
#         @paragraphs = map { "<p>$_</p>" } @paragraphs;
#         $text = join("\n\n", @paragraphs);
#         $i->attr(text => $text);
#     }
#     $doc->deobjectify_text;

    $doc = $doc->clone;
    my (@code) = $doc->look_down(_tag => qr/^(?:js|html|css|xml)$/);
    foreach my $i (@code) {
        my $id = $obj->attr('name') . (scalar @{$obj->{_code_samples}} + 1);
        my $div = XML::Element->new('div');
        $div->attr(sample => $id);
        $i->replace_with($div);

        $i->attr(type => $i->tag);
        $i->tag('code');
        $i->attr(id => $id);
        push @{$obj->{_code_samples}}, $i->as_HTML('<>', undef, {});
    }

    my (@pres) = $doc->look_down(_tag => 'pre');
    foreach my $i (@pres) {
        $i->objectify_text;
        my @children = $i->content_list;
        my $txt = $children[0];
        if ($txt && $txt->tag eq '~text') {
            my $text = $txt->attr('text');
            $text =~ s/^\n+//g;
            $txt->attr(text => $text);
        }
        $txt = $children[-1];
        if ($txt && $txt->tag eq '~text') {
            my $text = $txt->attr('text');
            $text =~ s/\s+$//g;
            $txt->attr(text => $text);
        }
        $i->deobjectify_text;
    }

    return getXML($obj, $method, $doc);
}

sub hyperlinks {
    my ($obj, $method, $orig_stuff) = @_;

    my ($oname, $static, $mname, $text);
    my $stuff = $orig_stuff;
    my @tmp = split(/\s*\|\s*/, $stuff);

    ## lookup link text
    if (@tmp > 1) {
        $text = $tmp[1];
        $stuff = $tmp[0];
    } else {
        $text = $stuff;
    }

    if ($stuff =~ /^[a-z0-9_\$]+$/i) {
        $oname = $stuff;
        return "<a href='api://$oname.xml'>$text</a>";
    }

    if ($stuff =~ /^[a-z0-9_\$]+\.js$/i) {
        return "<a href='src/js/$stuff' target='_blank'>$text</a>";
    }

    if ($stuff =~ /^([a-z0-9_\$]+)(\.|::)([a-z0-9_\$]+)\(\)$/i) {
        $oname = $1;
        $static = $2 eq '::' ? 'object_method' : 'static_method';
        $mname = $3;
        return "<a href='api://$oname.xml:type=$static:func=$mname'>$text</a>";
    }

    if ($stuff =~ /^(\.)?([a-z0-9_\$]+)\(\)$/i) {
        $mname = $2;
        $oname = $obj->attr('name');
        $static = $1 ? 'static_method' : 'object_method';
        $text =~ s/^\.?//;
        return "<a href='api://$oname.xml:type=$static:func=$mname'>$text</a>";
    }

#     {
#         no warnings 'all';
#         print STDERR "Object: $oname, Static: $static, Method: $mname, Text: $text\n";
#     }

    return $orig_stuff;
}

sub getXML {
    my ($obj, $method, $node) = @_;
    $node->tag('span');
    $node->attr(type => undef);
    my $xml = $node->as_HTML('<>', undef, {});
    $xml =~ s/&nbsp;/&amp;nbsp;/g; # HORRIBLE HACKS! :(
    $xml =~ s/〈(.*?)〉/hyperlinks($obj, $method, $1)/sge;
    $xml =~ s!^\s*\*{3}(.*)$!<p class='heading'>$1</p>!mg;
    $xml =~ s!^\s*X{3}(.*)$!<p class='warning'>$1</p>!mg;
    # $xml =~ s/^\s+//;
    # $xml =~ s/\s+$//;
    $xml =~ s/\n\n+/\n<p\/>\n/g;
    return $xml;
}
