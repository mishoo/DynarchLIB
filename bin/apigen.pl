#! /usr/bin/perl -w

BEGIN { $ENV{PERL_JSON_BACKEND} = 'JSON::PP' }

use Data::Dumper;
use lib '../perl';

use DynarchLIB::JSParser;
use DynarchLIB::XMLParser;
use Storable;

my $BASE_DIR = '..';
my $JS_DIR = "$BASE_DIR/src/js";
my $EXTRAS_DIR = "$BASE_DIR/src/extras";
my $API_DIR = "$BASE_DIR/jsdoc/api";
my $TT_DIR = "$API_DIR/tt";
my $OBJECTS_FILE = "$API_DIR/objects.storable";

my $TT = Template->new(INCLUDE_PATH => $TT_DIR,
                       PRE_CHOMP    => 1,
                       FILTERS      => { xml => \&tt_XML_filter }
                      );

# do_file("$JS_DIR/jslib.js");

my @all_objects = ();

my @files = <$JS_DIR/*.js>;

# exceptions
push @files, "$EXTRAS_DIR/cryptaes.js";

foreach my $file (@files) {
    print STDERR "Processing $file\n";
    my $p = do_file($file);
    push @all_objects, @{$p->{objects}};
}

my %objhash = ();
foreach my $obj (@all_objects) {
    $objhash{$obj->{name}} = $obj;
    my $mhash = {};
    foreach my $met (@{$obj->{object_methods}}) {
        $mhash->{$met->{name}} = $met;
    }
    $obj->{methods_hash} = $mhash;
}

store \%objhash, $OBJECTS_FILE;

sub do_file {
    my $filename = shift;
    my $p = DynarchLIB::JSParser->new($filename);
    # print STDERR Data::Dumper::Dumper($p);
    # return;

    my $dest = "$API_DIR/$p->{filename}";
    $dest =~ s/\.js$/.xml/;

    my $xml = DynarchLIB::XMLParser->new($dest, $p);
    $xml->update;
    logdebug("%s: XXX: +%d, objects(+%d -%d) args(+%d -%d) methods(+%d -%d) events(+%d -%d) params(+%d -%d)",
             $xml->{filename},
             $xml->{newxxx},
             $xml->{newobjects},
             $xml->{delobjects},
             $xml->{newargs},
             $xml->{delargs},
             $xml->{newmethods},
             $xml->{delmethods},
             $xml->{newevents},
             $xml->{delevents},
             $xml->{newparams},
             $xml->{delparams},
            );
    my $text = $xml->getXML;
    print join("\n", @{$xml->{log}}), "\n\n";

#    print $text;

    open FILE, '>', $dest;
    print FILE $text;
    close FILE;

    return $p;
}

sub tt_XML_filter {
    my $text = shift;
    $text =~ s/</&#x3c/g;
    $text =~ s/>/&#x3e/g;
    return $text;
}

sub getXML {
    my ($self) = @_;

    my $template = $self->{template};
    my $out;
    $TT->process($template, { self => $self }, \$out);
    return $out;
}

sub logdebug {
    my ($format, @args) = @_;
    my $str = sprintf($format, @args);
    print "$str\n";
}
