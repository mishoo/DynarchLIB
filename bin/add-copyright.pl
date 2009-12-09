#! /usr/bin/perl -w

use strict;

use FindBin qw( $RealBin );

my $basedir = "$RealBin/..";
my $text = `cat $basedir/copyright_templates/files.txt`;

add_copyright('src/js');

sub add_copyright {
    my ($where, @files) = @_;
    chdir "$basedir/$where";

    my $DOIT;
    unless (@files) {
        open $DOIT, '|-', 'add-copyright';
    } else {
        open $DOIT, '|-', 'add-copyright ' . join(' ', @files);
    }
    print $DOIT $text;
    close $DOIT;
}

