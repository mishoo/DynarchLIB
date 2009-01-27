#! /usr/bin/perl

use CGI;
use HTTP::Request;
use LWP::UserAgent;

print "Content-type: application/xml; charset=UTF-8\n\n";

my $cgi = CGI->new;

my $request = HTTP::Request->new(GET => $cgi->param('get'));
my $ua = LWP::UserAgent->new;
$response = $ua->request($request);

print $response->content;
