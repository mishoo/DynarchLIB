#! /usr/bin/perl -w

use strict;

my @files = @ARGV;
foreach my $i (@files) {
    # print STDERR "Retrieving images from $i\n";
    my @a = parse_file($i);
    if (@a) {
        print join("\n", @a) . "\n";
    }
}

sub parse_file {
    my %a = ();
    my $_shittize;
    $_shittize = sub {
        my ($filename) = @_;
        my $fh;
        open $fh, '<', $filename;
        local $/ = undef;
        my $content = <$fh>;
        no warnings 'uninitialized';
        $content =~ s#/\*[^*]*\*+([^/*][^*]*\*+)*/|//[^\n]*|("(\\.|[^"\\])*"|'(\\.|[^'\\])*'|.[^/"'\\]*)#$2#gs;
        close $fh;
        my @lines = split(/\n/, $content);
        foreach (@lines) {
            if (m{\@import\s+url\((['"])(.*?)\.(css)\1\)}) {
                my $file = "$2.$3";
                # print STDERR " -> $file\n";
                &$_shittize($file);
            } elsif (/url\((['"])(.*?)\.(jpe?g|png|gif|xpm|xbm|tiff?)\1/) {
                my $image = "$2.$3";
                $a{$image} = 1;
            }
        }
    };
    &$_shittize(shift);
    return keys %a;
}
