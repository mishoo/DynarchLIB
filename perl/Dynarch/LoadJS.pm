package Dynarch::LoadJS;

use Data::Dumper;
use Cwd qw(abs_path getcwd);

sub new {
    my ($class) = @_;
    my $self = { scripts => [],
                 requires => {},
                 contents => {},
                 relname => {},
                 passed => {},
                 final => [],
               };
    bless $self, $class;
}

sub load {
    my ($self, $dir, @jsfiles) = @_;

    my $orig_dir = getcwd;
    chdir $dir;
    my $fulldir = getcwd;

    @jsfiles = glob('*.js')
      unless @jsfiles;

    my $process;
    $process = sub {
        my ($file) = @_;
        my $full = abs_path($file);
        if (!$self->{passed}{$full}) {
            (my $relname = $full) =~ s{^$fulldir/*}{};
            $self->{relname}{$full} = $relname;
            $self->{passed}{$full} = 1;
            my $req = $self->_get_requires($file, $full);
            foreach my $i (@$req) {
                if ($i eq 'ALL') {
                    # nothing here
                } elsif ($i =~ m{^(.+?)/([^/]+)$}) {
                    my $orig_dir = getcwd;
                    chdir $1;
                    $process->($2);
                    chdir $orig_dir;
                } else {
                    $process->($i);
                }
            }
        }
    };

    foreach my $i (@jsfiles) {
        $process->($i);
    }
    chdir $orig_dir;
}

sub get_scripts {
    my ($self) = @_;

    # I'm not totally sure that the implementation of this is correct,
    # but it seems to do the job.  Basically we're walking the list of
    # requirements for each script and push them to @scripts in the
    # order that we found.
    my %checked = ();
    my $check;
    my @scripts;
    my $requires = $self->{requires};
    $check = sub {
        my $nodes = shift;
        foreach my $i (@$nodes) {
            if (!$checked{$i}) {
                $checked{$i} = 1;
                $check->($requires->{$i});
                push @scripts, $i;
            }
        }
    };
    my @a = sort keys %{$self->{requires}};
    $check->(\@a);
    push @scripts, @{$self->{final}};
    return @scripts;
}

sub get_rel_scripts {
    my ($self) = @_;
    return map { $self->{relname}{$_} } $self->get_scripts;
}

sub get_contents {
    my ($self) = @_;
    return map { $self->{contents}{$_} } $self->get_scripts;
}

sub get_include_code {
    my ($self, $path) = @_;
    $path ||= '';
    if ($path) {
        $path =~ s{/*$}{/};
    }
    return join("\n", (map {
        'document.write("<scr" + "ipt src=\'' .
          $path . $_ .
            '\'></scr" + "ipt>");'
        } $self->get_rel_scripts));
}

sub foreach_script {
    my ($self, $code) = @_;
    map { $code->($_) } $self->get_scripts;
}

sub _get_requires {
    my ($self, $fn, $full) = @_;
    open FILE, "< $fn";
    my $buffer = '';
    my @requires = ();
    my $final = 0;
    while (<FILE>) {
        $buffer .= $_;
        if (m{^//\s*\@requires?\s+([\x22\x27]?)([a-zA-Z0-9_./-]+)\1?}) {
            my $req = $2;
            if ($req eq 'ALL') {
                push @{$self->{final}}, $full;
                $final = 1;
            } else {
                push @requires, $req;
            }
        }
    }
    $self->{contents}{$full} = $buffer;
    unless ($final) {
        $self->{requires}{$full} = [ map { abs_path($_) } @requires ];
    }
    close FILE;
    return \@requires;
}

1;
