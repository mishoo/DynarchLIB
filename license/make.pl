#! /usr/bin/perl -w

use Template;
use JSON;

my $json;
{
    open FILE, '<test.js';
    local $/ = undef;
    $json = <FILE>;
    close FILE;
}
# local $JSON::BareKey = 1;
# local $JSON::QuotApos = 1;
my $data = jsonToObj($json);

my $t = new Template(
    START_TAG    => '〈',
    END_TAG      => '〉',
    INCLUDE_PATH => '.',
    VARIABLES    => $data,
    PRE_CHOMP    => 1,
    FILTERS      => { tex => \&tt_TeX_filter },
);

my $out;
$t->process('license.tex', undef, \$out)
  or die $t->error;
open OUT, '>output.tex';
print OUT $out;
close OUT;

system 'pdflatex output.tex';
system 'pdflatex output.tex';
system 'pdflatex output.tex';

system 'tex2page output.tex';
system 'tex2page output.tex';
system 'tex2page output.tex';

sub tt_TeX_filter {
    my ($str) = @_;
    $str =~ s/([\${}_])/\\$1/g;
    return $str;
}
