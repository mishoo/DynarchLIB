package DynarchLIB::JSParser;

use strict;

use File::Basename;
use Digest::MD5 qw( md5_hex );
use Template;

use JSON;

my $json = JSON->new->utf8;
$json->relaxed;
$json->allow_barekey;

#
# This file implements a JavaScript parser which is useful to generate
# an API docs skeleton.  This parser will take into account our
# general coding style for DynarchLIB, namely:
#
# - all objects are defined in an anonymous function
# - they are exported by calling Dynarch.EXPORT
# - the constructor arguments are defined in a D.DEFAULT_ARGS hash table
# - all instance methods are defined as P.methodName = function(...)
# - all class (static) methods are defined as D.methodName = function(...)
# - all events are defined in a private DEFAULT_EVENTS variable (array)
# - each file may contain a /*DESCRIPTION ... DESCRIPTION*/ comment
#

my $RX_CPP_COMMENT  = qr{^//(.*\n)};
my $RX_C_COMMENT    = qr{^/\*((?:.|\n)*?)\*/};
my $RX_STRING       = qr/^("(\\.|[^"\\])*"|'(\\.|[^'\\])*')/;
my $RX_ASSIGN       = qr/^([a-zA-Z0-9_\$.]+)\s*[=:]\s*/; # ident as $1
my $RX_FUNCTION     = qr/^function(\s+([a-zA-Z0-9_\$]+)|\s*)\((.*?)\)\s*/; # func. name as $2, arguments as $3
my $RX_INHERITS     = qr{^([a-zA-Z0-9_\$.]+)\.inherits\s*\((.*?)\)}; # BASE as $2, OBJ as $1
my $RX_BLOCK_START  = qr{^\{};
my $RX_BLOCK_END    = qr{^\}};
my $RX_EXPORT       = qr{^Dynarch\.EXPORT\s*\((['"])(.*?)\1};
my $RX_IDENTIFIER   = qr{([a-zA-Z\$_][a-zA-Z0-9\$_]*)};
my $RX_REQUIRES     = qr{^\s*\@require\s+([a-zA-Z0-9_.-]+)};

sub new {
    my ($class, $file, $template) = @_;
    my $filename = basename $file;
    my $self = { filename => $filename,
                 objects  => [],
                 template => $template || 'API.tt',
                 requires => [],
               };
    bless $self, $class;
    $self->parseFile($file);
    return $self;
}

sub parseFile {
    my ($self, $file) = @_;
    my $content;
    open FILE, '<', $file;
    {
        local $/ = undef;
        $content = <FILE>;
    }
    close FILE;
    $self->parse($content);
}

sub trim {
    my ($str) = @_;
    if ($str) {
        $str =~ s/^\s+//;
        $str =~ s/\s+$//;
        return $str;
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

sub parse {
    my ($self, $C) = @_;

    my %objects_by_name = ();
    my @objects = ();

    $self->{objects} = \@objects;

    my $get_object = sub {
        my ($name) = @_;
        my $obj = $objects_by_name{$name};
        if (!$obj) {
            $obj = { name           => $name,
                     constructor    => { params => [] },
                     static_methods => [],
                     object_methods => [],
                     internal       => 1,
                     js_file        => $self->{filename},
                     requires       => $self->{requires},
                   };
            $objects_by_name{$name} = $obj;
            push @objects, $obj;
        }
        return $obj;
    };

    my ($parseFunction, $parseBlock);

    $parseBlock = sub {
        my ($C, $level, $cobj, $is_proto) = @_;
        $C = trim($C);

        while ($C) {
            if ($C =~ /$RX_CPP_COMMENT/g) {
                my $comment = $1;
                $C = substr($C, pos $C);
                if ($comment =~ /$RX_REQUIRES/) {
                    push @{$self->{requires}}, split(/\s*,\s*/, $1);
                }
            } elsif ($C =~ /$RX_C_COMMENT/g) {
                my $comment = $1;
                if ($comment =~ /$RX_REQUIRES/) {
                    # should we allow this in /**/-style comments?
                    # let's do for now.
                    push @{$self->{requires}}, split(/\s*,\s*/, $1);
                }
                $C = substr($C, pos $C);
            } elsif ($C =~ /$RX_STRING/g) {
                $C = substr($C, pos $C);
            } elsif ($C =~ /$RX_INHERITS/g) {
                my ($obj, $base) = ($1, $2);
                $C = substr($C, pos $C);
                $obj = trim($obj);
                $base = trim($base);
                $get_object->($obj)->{base} = $base;
            } elsif ($C =~ /$RX_EXPORT/g) {
                $cobj = $2;
                $C = substr($C, pos $C);
                $cobj = $get_object->($cobj);
                $cobj->{internal} = 0;
            } elsif ($C =~ /$RX_ASSIGN/g) {
                my $identifier = $1;
                $C = substr($C, pos $C);
                my $tmp = $parseFunction->($C, $cobj, $identifier, $is_proto);
                if ($tmp) {
                    $C = $tmp;
                } elsif ($C =~ /^[\{\[]/) {
                    ## defining an object?  Which one is it?
                    if ($identifier =~ /DEFAULT_ARGS$/) {
                        my $block;
                        ($block, $C) = parseBalancedText($C, 1);
                        # debug("DEFAULT_ARGS: %s", $block);
                        $cobj->{default_args} = parseDefaultArgs($block);
                        # LOOKS like we're going to need our own parsing... :-(
                        # local $JSON::BareKey = 1;
                        # my $args = jsonToObj($block);
                        # print Data::Dumper::Dumper($args);
                    } elsif ($identifier =~ /DEFAULT_EVENTS$/) {
                        my $block;
                        ($block, $C) = parseBalancedText($C, 1);
                        # debug("DEFAULT_EVENTS: %s", $block);
                        $cobj->{default_events} = parseDefaultEvents($block);
                    } elsif ($identifier =~ /^(Dl.*)/ ||
                             $identifier =~ /^window\.$RX_IDENTIFIER$/) {
                        my $obj = $1;
                        my $is_proto = 0;
                        if ($obj =~ /^(.*)\.prototype$/) {
                            $obj = $1;
                            $is_proto = 1;
                        }
                        $obj = $get_object->($obj);
                        $obj->{internal} = 0;
                        my $block;
                        ($block, $C) = parseBalancedText($C, 1, 1);
                        $parseBlock->($block, $level + 1, $obj, $is_proto);
                    }
                }
            } elsif ($C =~ /$RX_FUNCTION/g) {
                my ($name, $args) = ($2, $3);
                my $pos = pos $C;
                if ($name && $name =~ /^Dl/) {
                    ## constructor
                    $C = $parseFunction->($C);
                } else {
                    $C = substr($C, $pos);
                }
            } else {
                $C = substr($C, 1);
            }
        }
    };

    $parseFunction = sub {
        my ($C, $cobj, $identifier, $is_proto) = @_;
        if ($C =~ /$RX_FUNCTION/g) {
            my ($name, $args) = ($2, $3);
            $C = substr($C, pos $C);
            $name = trim($name);
            $args = trim($args);
            my $args_array = [];
            if ($args) {
                $args_array = [ split(/\s*,\s*/, $args) ];
            }
            my $method_name;
            my $method_type = 'none';
            if ($name) {
                ## not anonymous?  hmm, that's interesting...
                $method_name = $name;
                if ($name =~ /^Dl/) {
                    ## constructor
                    $method_type = 'constructor';
                    $cobj = $get_object->($name);
                }
            } elsif ($identifier =~ /^P\./) {
                $method_type = 'object';
                $method_name = substr($identifier, 2);
            } elsif ($self->{filename} ne 'jslib.js' && $identifier =~ /^D\./) {
                $method_type = 'static';
                $method_name = substr($identifier, 2);
            } elsif ($identifier) {
                if ($identifier =~ /$RX_IDENTIFIER\.prototype\.$RX_IDENTIFIER/) {
                    ($cobj, $identifier) = ($1, $2);
                    # debug("Found proto (%s / %s)", $cobj, $identifier);
                    $cobj = $get_object->($cobj);
                    $method_type = 'object';
                } elsif ($identifier =~ /$RX_IDENTIFIER\.$RX_IDENTIFIER/) {
                    ($cobj, $identifier) = ($1, $2);
                    if ($cobj !~ /^[A-Z]/) {
                        # XXX: probably some internal catch; ignore it.
                        return undef;
                    }
                    $method_type = 'static';
                    if ($self->{filename} eq 'jslib.js') {
                        # XXX: special hacks required for jslib.js
                        if ($cobj eq 'S') {
                            $cobj = 'String';
                            $method_type = 'object';
                        }
                        if ($cobj eq 'F') {
                            $cobj = 'Function';
                            $method_type = 'object';
                        }
                        if ($cobj eq 'N') {
                            $cobj = 'Number';
                            $method_type = 'object';
                        }
                        if ($cobj eq 'D') {
                            $cobj = 'Date';
                            $method_type = 'object';
                        }
                        if ($cobj eq 'A') {
                            $cobj = 'Array';
                            $method_type = 'object';
                        }
                    }
                    $cobj = $get_object->($cobj);
                    $cobj->{internal} = 0;
                } else {
                    $method_type = $is_proto ? 'object' : 'static';
                }
                $method_name = $identifier;
            }
            my $method = { type      => $method_type,
                           name      => $method_name,
                           params    => $args_array,
                           internal  => $method_name =~ /^_/ ? 1 : 0,
                           undoc     => $method_name =~ /^__/ ? 1 : 0,
                         };
            my $block;
            ($block, $C) = parseBalancedText($C);
            $method->{codehash} = md5_hex($block);
            if ($method_type eq 'static') {
                push @{$cobj->{static_methods}}, $method;
            } elsif ($method_type eq 'object') {
                push @{$cobj->{object_methods}}, $method;
            } elsif ($method_type eq 'constructor') {
                $cobj->{constructor} = $method;
            }
            $method->{use_arguments} = $block =~ /\Warguments\W/ ? 1 : 0;
            return $C;
        }
        return undef;
    };

    $parseBlock->($C, 0);

    ## order methods

    foreach my $obj (@objects) {
        my @static_methods = sort { cmp_alphainternal($a, $b) } @{$obj->{static_methods}};
        $obj->{static_methods} = \@static_methods;
        my @object_methods = sort { cmp_alphainternal($a, $b) } @{$obj->{object_methods}};
        $obj->{object_methods} = \@object_methods;
    }
}

my %PARENS = (
              '{' => '}',
              '[' => ']',
              '(' => ')',
             );

sub parseBalancedText {
    my ($C, $includeWS, $includeComments) = @_;
    my $paren = substr($C, 0, 1);
    my $close = $PARENS{$paren};
    $C = substr($C, 1);
    my $block = 1;
    my $code = $paren;
    while ($C && $block) {
        if ($C =~ /$RX_CPP_COMMENT/g) {
            if ($includeComments) {
                $code .= "//$1";
            }
            $C = substr($C, pos $C);
        }
        elsif ($C =~ /$RX_C_COMMENT/gs) {
            if ($includeComments) {
                $code .= "/*$1*/";
            }
            $C = substr($C, pos $C);
        }
        elsif ($C =~ /$RX_STRING/g) {
            $code .= $1;
            $C = substr($C, pos $C);
        }
        else {
            my $char = substr($C, 0, 1);
            if ($char eq $paren) {
                $block++;
            } elsif ($char eq $close) {
                $block--;
            }
            if ($char =~ /\S/ || $includeWS) {
                $code .= $char;
            }
            $C = substr($C, 1);
        }
    }
    return ($code, $C);
}

sub parseDefaultArgs {
    my ($code) = @_;
    while (1) {
        eval {
            $code = $json->decode($code);
        };
        if ($@) {
            if ($@ =~ /([0-9]+)/) {
                my $char = $1 - 1;
                pos($code) = $char;
                $code =~ s/\G(.+?)\s*\]/">$1<" ]/;
                # debug($code);
            }
        } else {
            last;
        }
    }
    my @args = ();
    while (my ($key, $val) = each %$code) {
        my $name = $val->[0];
        my $def = $json->pretty->encode({ val => $val->[1] });
        $def =~ s/\{\s*"val"\s*:\s*(.*?)\s*\}/$1/s;
        $def =~ s/^">(.*?)<"$/$1/;
        $def =~ s/^\[\s+\]$/[]/;
        $def =~ s/^\{\s+\}$/{}/;
        push @args, { name     => $name,
                      default  => $def,
                      target   => $key,
                      internal => $name =~ /^_/ ? 1 : 0,
                    };
    }
    @args = sort { cmp_alphainternal($a, $b) } @args;
    return \@args;
}

sub parseDefaultEvents {
    my ($code) = @_;
    # debug("PARSING DEFAULT EVENTS: $code");
    $code = $json->decode($code);
    return $code;
}

sub debug {
    my ($format, @args) = @_;
    my $str = sprintf($format, @args);
    print STDERR "$str\n";
}

1;
