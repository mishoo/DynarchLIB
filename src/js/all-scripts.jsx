[% PERL %] # -*- cperl -*-

use lib '/home/mishoo/work/thelib/perl';

use Dynarch::JSCrunch;
use Dynarch::LoadJS;
use CGI;

my $loader = Dynarch::LoadJS->new;
$loader->load("/home/mishoo/work/thelib/src/js");
my $cgi = CGI->new;
my $path = $cgi->param('path');

if (!$cgi->param('crunch')) {
    print $loader->get_include_code($path);
} else {
    my $code = join("\n", $loader->get_contents);
    my $crunch = Dynarch::JSCrunch->new(no_comment => 1, data => $code);
    print $crunch->execute;
}

[% END %]
