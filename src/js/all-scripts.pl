#! /usr/bin/perl -w

use lib '/home/mishoo/cvs/libperl';
use dynarch::JSCrunch;
use CGI;

my @scripts = ();

my %requires = ();
my %contents = ();

my @jsfiles = <*.js>;
foreach my $i (@jsfiles) {
    $requires{$i} = get_requires($i);
}

{
    # I'm not totally sure that the implementation of this is correct,
    # but it seems to do the job.  Basically we're walking the list of
    # requirements for each script and push them to @scripts in the
    # order that we found.
    my %checked = ();
    my $check;
    $check = sub {
        my $nodes = shift;
        # print STDERR "CHECKING ", join("-", @$nodes), "\n";
        foreach my $i (@$nodes) {
            if (!$checked{$i}) {
                $checked{$i} = 1;
                &$check($requires{$i});
                push @scripts, $i;
            }
        }
    };
    my @a = keys %requires;
    &$check(\@a);
}

# print STDERR "Deteremined order:\n\t", join("\n\t", @scripts), "\n";

my $cgi = new CGI;

my $path = $cgi->param('path') || 'src/js';

print "Content-type: text/javascript\n\n";
if ($cgi->param('crunch')) {
    my $buffer = '';
    foreach my $i (@scripts) {
        $buffer .= $contents{$i};
    }

    my $jsc = new dynarch::JSCrunch(data => $buffer, no_comment => 1);
    $buffer = $jsc->execute();
    print $buffer;
} else {
    foreach my $i (@scripts) {
        print 'document.write("<scr" + "ipt src=\'' , $path, '/', $i, '\'></scr" + "ipt>");', "\n";
    }
}

sub get_requires {
    my ($filename) = @_;
    open FILE, $filename;
    my $buffer = '';
    my @requires = ();
    while (<FILE>) {
        $buffer .= $_;
        push @requires, $2
          if m{^//\s*\@requires?\s*([\x22\x27]?)([a-zA-Z0-9_./-]+)\1?};
    }
    $contents{$filename} = $buffer;
    # print STDERR "$filename -> ", join(', ', @requires), "\n";
    close FILE;
    return \@requires;
}
