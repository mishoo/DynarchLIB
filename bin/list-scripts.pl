#! /usr/bin/perl -w

use strict;

use FindBin;
use lib "$FindBin::Bin/../perl";
use Dynarch::LoadJS;

my $loader = Dynarch::LoadJS->new;
$loader->load("$FindBin::Bin/../src/js/");
$loader->foreach_script(
    sub {
        my ($script) = @_;
        print "$script\n";
    }
);
