[% PERL %] # -*- cperl -*-
;

use CGI;
use Cwd qw(abs_path getcwd);

{
    my $cwd = getcwd();
    require "$cwd/../../perl/Dynarch/LoadJS.pm";

    my $loader = Dynarch::LoadJS->new;
    $loader->load($cwd);
    my $cgi = CGI->new;
    my $path = $cgi->param('path');
    print $loader->get_include_code($path);
}

[% END %]
