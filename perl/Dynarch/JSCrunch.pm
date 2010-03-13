### Strip whitespace from JavaScript and CSS files
### Optionally mangle the result
### Copyright (c) Dynarch.com, 2004
### All rights reserved.

# $Id: JSCrunch.pm,v 1.2 2004/09/20 11:12:14 mishoo Exp $

package Dynarch::JSCrunch;

sub new {
    my ($class, %o) = @_;
    my $self = {};
    foreach (qw{data css mangle no_comment name debug}) {
        $self->{$_} = $o{$_};
    }
    bless $self, $class;
};

sub execute {
    my $self = shift;
    my $content = $self->{data};
    my $comment = '';
    if (! $self->{no_comment} and ($content =~ s#^\s*(/\*.*?\*/)##s or $content =~ s#^\s*(//.*?)\n\s*[^/]##s)) {
        $comment = "$1\n";
    }

    # removing C/C++ - style comments:
    {
        no warnings 'uninitialized';
        $content =~ s#/\*[^*]*\*+([^/*][^*]*\*+)*/|//[^\n]*|("(\\.|[^"\\])*"|'(\\.|[^'\\])*'|.[^/"'\\]*)#$2#gs;
    }

    if ($self->{debug} && !$self->{css}) {
        # basic syntax checking
        while ($content =~ m#(.{0,50})([]a-zA-Z0-9"'[])\s*?\n[\s\t]*([^]}).?\s\t:({&|"'])#sg) {
            my $code = "$1$2";
            next if $code =~ /(?:else|var|return|do|while|for)$/;
            my $char = $3;
            $code =~ s/^\s+//;
            $code =~ s/\s+$//;
            $code =~ s/\s+/ /g;
            $self->{problems} = 1;
            print STDERR "PROBLEM ($char): $code\n";
        }
    }

    # save string literals
    my @strings = ();
    $content =~ s/("(\\.|[^"\\])*"|'(\\.|[^'\\])*')/push(@strings, "$1");'__CMPRSTR_'.$#strings.'__';/egs;

    # remove C-style comments
    $content =~ s#/\*.*?\*/##gs;

    if (!$self->{css}) {
        # remove C++-style comments
        $content =~ s#//.*?\n##gs;
        # removing leading/trailing whitespace:
        # $content =~ s#(?:(?:^|\n)\s+|\s+(?:$|\n))##gs;
        # removing newlines:
        # $content =~ s#\r?\n##gs; #-- done at next step
    }

    # removing other whitespace (between operators, etc.) (regexp-s stolen from Mike Hall's JS Crunchinator)
    $content =~ s/\s+/ /gs;     # condensing whitespace

    if (!$self->{css}) {
        $content =~ s/\s([\x21\x25\x26\x28\x29\x2a\x2b\x2c\x2d\x2f\x3a\x3b\x3c\x3d\x3e\x3f\x5b\x5d\x5c\x7b\x7c\x7d\x7e])/$1/gs;
        $content =~ s/([\x21\x25\x26\x28\x29\x2a\x2b\x2c\x2d\x2f\x3a\x3b\x3c\x3d\x3e\x3f\x5b\x5d\x5c\x7b\x7c\x7d\x7e])\s/$1/gs;
    } else {
        $content =~ s#(?:(?:^|\n)\s+|\s+(?:$|\n))##gs;
    }

    # restore string literals
    $content =~ s/__CMPRSTR_([0-9]+)__/$strings[$1]/egs;

    sub letter {
        my $l = shift;
        if ($l =~ /[a-z]/) {
            return chr(ord('a') + ord('z') - ord($l));
        } else {
            return chr(ord('A') + ord('Z') - ord($l));
        }
    };

#     if ($self->{mangle} && !$self->{css}) {
#         $content =~ s/([a-zA-Z])/letter($1)/gse;
#         $content =~ s/\\/\\\\/g;
#         $content =~ s/'/\\'/g;
#         #$prefix = 'T=new Date().getTime();';
#         $prefix = '';
#         $prefix .= 'eval(\'';
#         # new and improved "algorithm" ;-)
#         $suffix = q#'.replace(/[a-zA-Z]/g,function(p){p=p.charCodeAt(0);return(String.fromCharCode((p>96&&p<123)?(219-p):(155-p)));}));#;
#         #$suffix .= 'alert(new Date().getTime()-T);';
#         $content = $prefix.$content.$suffix;
#     }

    if ($self->{mangle} && !$self->{css}) {
        $content =~ s/([a-zA-Z])/letter($1)/gse;
        $content =~ s/\\/\\\\/g;
        $content =~ s/'/\\'/g;
        #$prefix = 'T=new Date().getTime();';
        $prefix = '';
        $prefix .= '(function(){var i,p,__,_=\'';
        # new and improved "algorithm" ;-)
        $suffix = '\';if(/opera|khtml|msie\s+5\.0/i.test(navigator.userAgent)){';
        $suffix .= q#;for(__='',i=0;i<_.length;p=_.charCodeAt(i++),__+=String.fromCharCode((p>96&&p<123)?(219-p):(p>64&&p<91)?(155-p):p));eval(__);#;
        $suffix .= q#}else eval(_.replace(/[a-zA-Z]/g,function(p){p=p.charCodeAt(0);return(String.fromCharCode((p>96&&p<123)?(219-p):(155-p)));}));#;
        $suffix .= '})();';
        #$suffix .= 'alert(new Date().getTime()-T);';
        $content = $prefix.$content.$suffix;
    }

    return $comment . $content;
};

1;
