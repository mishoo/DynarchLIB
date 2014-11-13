#! /usr/bin/perl

use FindBin;
use lib "$FindBin::Bin/../../perl";
use Dynarch::LoadJS;

my $loader = Dynarch::LoadJS->new;
$loader->load($FindBin::Bin);
my $path = $ARGV[0];
print $loader->get_include_code($path);
