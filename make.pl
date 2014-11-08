#! /usr/bin/perl -w

use strict;

use FindBin;
use lib "$FindBin::Bin/perl";

use File::Temp qw( tempdir );
use File::Find;
use File::Path qw( mkpath rmtree );
use File::Copy;
use Template::Alloy;
use Getopt::Long;
use POSIX;
use JSON;

my $json = new JSON->utf8;

use Dynarch::LoadJS;

my $opt_full_source = 1;
GetOptions(
    'full|f=i'  => \$opt_full_source,
);

my $DL_VERSION = "2.0";

my $TT_VARS = { final      => 1,
                build_time => strftime('%Y/%m/%d %H:%M GMT', gmtime),
                dl_version => $DL_VERSION };

my $orig_dir = getcwd;

chdir "src/as";
system "./compile";
chdir $orig_dir;

my @DIRS = qw(.);

my $tmpdir = tempdir( CLEANUP => 1 );
my $destdir = "$tmpdir/DynarchLIB";
# print "$destdir\n";

mkdir $destdir;

### Copy files

use vars qw( *find_name *find_dir *find_prune );
*find_name = *File::Find::name;
*find_dir = *File::Find::dir;
*find_prune = *File::Find::prune;

File::Find::find({ wanted => \&wanted, no_chdir => 1 }, @DIRS);

### Postprocess JavaScript

my $core_comment;
{
    my $tmpl = Template::Alloy->new({ INCLUDE_PATH => "$orig_dir/copyright_templates",
                                      ADD_LOCAL_PATH => 1,
                                      VARIABLES    => $TT_VARS });
    $tmpl->process('thelib.tt', undef, \$core_comment);
}

if ($opt_full_source) {
    # save src/js
    chdir "$destdir";
    mkdir "full-source";
    system "cp -r src/js full-source";
    system "cp -r src/extras full-source";
    # chdir "$destdir/full-source";
    # my @files = `find . -name '*.js'`;
    # foreach my $fn (@files) {
    #     chomp $fn;
    #     open FILE, '<', $fn;
    #     local $/ = undef;
    #     my $content = <FILE>;
    #     close FILE;
    #     open FILE, '>', $fn;
    #     print FILE "$core_comment\n\n$content";
    #     close FILE;
    # }
}

chdir "$destdir/src/js";

{
    my $loader = Dynarch::LoadJS->new;
    $loader->load("$destdir/src/js");

    open DEBUG_JS_LOAD, "> /tmp/dynarch-loadjs.log";
    print DEBUG_JS_LOAD join("\n", $loader->get_scripts);
    close DEBUG_JS_LOAD;

    if ($opt_full_source) {
        my $content = join("\n", $loader->get_contents);
        open FILE, '> thelib-full.js';
        print FILE $content;
        close FILE;
    }

    system "uglifyjs2 @{[ join ' ', $loader->get_scripts ]} -o thelib.js --source-map thelib.js.map --source-map-root http://dynarchlib.local/full-source/js/ -p 5 -m -c unsafe_comps=1,hoist_vars=1";
    unlink $loader->get_scripts;

    if ($opt_full_source) {
        chdir "$destdir/full-source/js";
        open FILE, '> _load_all.js';
        my @scripts = $loader->get_rel_scripts;
        my $json_scripts = $json->encode(\@scripts);
        print FILE <<EOF
(function(){
    var scripts = $json_scripts;
    for (var i = 0; i < scripts.length; ++i) {
        document.write("<script src='" + DYNARCHLIB_DEVEL_URL + "/full-source/js/" + scripts[i] + "'></script>");
    }
})();
EOF
;
        close FILE;
    }
}

chdir "$destdir/src/extras";
foreach my $file (<*.js>) {
    system "uglifyjs $file -cm -o $file";
}

chdir "$destdir/jsdoc/hl";
system 'cat highlight.js lang-js.js lang-dljs.js lang-css.js lang-xml.js lang-html.js helpers.js > hl-all.js';
system 'uglifyjs hl-all.js -cm -o hl-all.js';

### Create "css/preload-default.js" - for preloading images

chdir "$destdir/";

{
    my $tmp = `$orig_dir/bin/make-images-lists.pl src/css/default.css`;
    my @imgs = split(/\n/, $tmp);
    my $tmpl = new Template::Alloy({ INCLUDE_PATH => $destdir,
                                     ADD_LOCAL_PATH => 1,
                                     EVAL_PERL => 1,
                                     VARIABLES => $TT_VARS });
    my $output;
    $tmpl->process('src/css/preload-default.js', {
        images => join(' ', @imgs)
    }, \$output);
    open OUT, "> src/css/preload-default.js";
    print OUT $output;
    close OUT;
}

### Postprocess CSS

# {
#     my $tmpl = new Template::Alloy({ INCLUDE_PATH => '.',
#                                      ADD_LOCAL_PATH => 1,
#                                      EVAL_PERL => 1,
#                                      VARIABLES => $TT_VARS });

#     my @css = qw( src/css/default.css
#                   jsdoc/doc.css );

#     # Good values: 200 (cyan-blue), 0-20 (red), 75-90 (green), 300 (pink), 30 (yellow)
#     my %themes = (
#         'ds'         => '-h 239:299 -m 239 -a -s 0.5',
#         'grey'       => '-h 239:299 -m 239 -a -s 0',
#         'blue'       => '-h 239:299 -m 210 -a',
#         'blue-ds'    => '-h 239:299 -m 210 -a -s 0.5',
#         'red'        => '-h 239:299 -m 10 -a',
#         'red-ds'     => '-h 239:299 -m 10 -a -s 0.5',
#         'green'      => '-h 239:299 -m 85 -a',
#         'green-ds'   => '-h 239:299 -m 85 -a -s 0.5',
#         'yellow'     => '-h 239:299 -m 30 -a',
#         'yellow-ds'  => '-h 239:299 -m 30 -a -s 0.5',
#         'magenta'    => '-h 239:299 -m -90 -a',
#         'magenta-ds' => '-h 239:299 -m -90 -a -s 0.5',
#         'cyan'       => '-h 239:299 -m 189 -a',
#         'cyan-ds'    => '-h 239:299 -m 189 -a -s 0.5',
#     );

#     foreach my $file (@css) {
#         my $css;
#         $tmpl->process($file, undef, \$css);
#         open CSS, "> $file";
#         print CSS $css;
#         close CSS;

#         while (my ($name, $args) = each %themes) {
#             (my $tfile = $file) =~ s/\.css$/"-${name}.css"/g;
#             system "modify-colors.pl $args < $file > $tfile";
#         }
#     }
# }

### Postprocess documentation (index.html)

chdir "$destdir/";
{
    my $tmpl = new Template::Alloy({ INCLUDE_PATH => $destdir,
                                     ADD_LOCAL_PATH => 1,
                                     EVAL_PERL => 1,
                                     VARIABLES => $TT_VARS });
    my $foo;
    $tmpl->process('index.html', undef, \$foo)
      || die $tmpl->error;
    open FOO, '> index.html';
    print FOO $foo;
    close FOO;

    $tmpl->process('jsdoc/doc.js', undef, \$foo);
    open FOO, '> jsdoc/doc.js';
    print FOO $foo;
    close FOO;

    $tmpl->process('samples/grid/index.html', undef, \$foo)
      or die $tmpl->error;
    open FOO, '> samples/grid/index.html';
    print FOO $foo;
    close FOO;
}

### Postprocess tests

chdir "$orig_dir";
{
    my $tmpl = new Template::Alloy({ INCLUDE_PATH => $orig_dir,
                                     OUTPUT_PATH => "$destdir/tests",
                                     ADD_LOCAL_PATH => 1,
                                     EVAL_PERL => 1,
                                     VARIABLES => $TT_VARS });

    File::Find::find({ wanted => sub {
                           $find_dir =~ s{^\./}{};
                           $find_name =~ s{^\./}{};
                           if (-f $find_name && $find_name =~ /\.js$/) {
                               mkpath([ "$destdir/$find_dir" ]);
                               copy($find_name, "$destdir/$find_dir");
                               if ($find_name ne 'tests/tests.js') {
                                   $find_name =~ s{^tests/+}{};
                                   my $output_name = $find_name;
                                   $output_name =~ s{/+}{_}g;
                                   $output_name =~ s/\.js/.html/;
                                   $output_name = "test-$output_name";
                                   $tmpl->process('tests/index.html', { cgi => { file => $find_name }}, $output_name);
                               }
                           }
                       }, no_chdir => 1 }, 'tests');
}


### Create ZIP

chdir "$destdir";

system "find . -name '*.cgi' -exec chmod 755 {} \\;";
system "find . -name '*.tt' -exec rm -f {} \\;";
system "find src/deprecated -name '*.js' -exec uglifyjs {} -cm -o {} \\;";

chdir "$tmpdir";
system "zip -r -q DynarchLIB.zip DynarchLIB";
system "mv DynarchLIB.zip '$orig_dir'";

chdir "$orig_dir";




### END ###

sub wanted {
    $find_dir =~ s{^\./}{};
    $find_name =~ s{^\./}{};
    if (-f $find_name) {
        my $find_filename = $_;
        if (include($find_name) && !exclude($find_name)) {
            # print STDERR "$find_name in $find_dir\n";
            mkpath([ "$destdir/$find_dir" ]);
            copy($find_name, "$destdir/$find_dir");
        }
    }
}

sub include {
    my ($fn) = @_;
    return ($fn =~ /\.(?:js|s?css|html|swf|tt)$/
              or (
                  $fn =~ m{^src/css/img} or
                    $fn =~ m{^src/new-theme/img} or
                      $fn =~ m{^src/new-theme/DLimg} or
                        $fn =~ m{^jsdoc/}
                  )
          );
}

sub exclude {
    my ($fn) = @_;
    return 1
      if ($fn =~ m{(?:/|^)(?:\.svn|\.hg.*|\.git.*|old|tmp)(?:/|$)});
    return 1
      if ($fn =~ m{^(?:license|bugs|tests)/});
    return 0;
}
