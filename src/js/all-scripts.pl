#! /usr/bin/perl -w
##> This file is part of DynarchLIB, an AJAX User Interface toolkit
##> http://www.dynarchlib.com/
##>
##> Copyright (c) 2004-2009, Mihai Bazon, Dynarch.com.  All rights reserved.
##>
##> Redistribution and use in source and binary forms, with or without
##> modification, are permitted provided that the following conditions are
##> met:
##>
##>     * Redistributions of source code must retain the above copyright
##>       notice, this list of conditions and the following disclaimer.
##>
##>     * Redistributions in binary form must reproduce the above copyright
##>       notice, this list of conditions and the following disclaimer in
##>       the documentation and/or other materials provided with the
##>       distribution.
##>
##>     * Neither the name of Dynarch.com nor the names of its contributors
##>       may be used to endorse or promote products derived from this
##>       software without specific prior written permission.
##>
##> THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDER “AS IS” AND ANY
##> EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
##> IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
##> PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE LIABLE
##> FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
##> CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
##> SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
##> INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
##> CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
##> ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
##> THE POSSIBILITY OF SUCH DAMAGE.


use FindBin;
use lib "$FindBin::Bin/../../perl";
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
foreach my $i (@scripts) {
    print 'document.write("<scr" + "ipt src=\'' , $path, '/', $i, '\'></scr" + "ipt>");', "\n";
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
