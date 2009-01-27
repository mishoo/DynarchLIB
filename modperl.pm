package JSToolkit::ModPerl;

use strict;
use vars qw( $VERSION );
use Apache2::Const qw( :common );
use Template::Alloy;
use CGI;
use Cwd;
use File::Basename;

$VERSION = 3.14;

sub handler {
    my $r = shift;

    return DECLINED
      if ! -f $r->filename ||
        $r->filename !~ /\.(html?|css|jss?x?)$/;

    my $suffix = ".$1";
    my $filename = $r->filename;
    my $basedir = dirname($filename);

    my $q = new CGI;
    my $cgivars = $q->Vars;

    chdir $basedir;

    my $vars = { cgi => $cgivars
               };

    # create a template processing object
    my $template = Template::Alloy->new({
        ABSOLUTE       => 1,
        INCLUDE_PATH   => "/home/mishoo/work/thelib",
        ADD_LOCAL_PATH => 1,
        OUTPUT         => $r,    # direct output to Apache request
        EVAL_PERL      => 1,
    });

    # use the path_info to determine which template file to process
    my $file = $r->filename;

    if ($suffix =~ /.jss?x$/) {
        $r->content_type('text/javascript; charset: utf-8');
    }

    # $r->content_type('text/html; charset: utf-8');
    # $r->send_http_header;

    $template->process($file, $vars)
      || return fail($r, SERVER_ERROR, $template->error);

    return OK;
}

sub fail {
    my ($r, $status, $message) = @_;
    $r->log_reason($message, $r->filename);
    $r->print("<html><body><h1>ERROR</h1>$message</body></html>");
    return OK;
}
