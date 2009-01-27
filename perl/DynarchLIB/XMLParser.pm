package DynarchLIB::XMLParser;

use Encode;
use File::Basename;

#
# if you wonder why we need both of these, well, because: if the XML
# file doesn't already exist, XML::Element will create a one-line
# pice of garbage -- which we'll indent later using XML::Twig
#
use XML::Twig;
use DynarchLIB::XML_TreeBuilder;

#
# Read an api XML documentation for one JavaScript file and correlate
# it with the structure defined in a DynarchLIB::JSParser object.  If
# the XML is not found, it will be generated (actually the situation
# is treated as if the XML is found but it's empty).
#
# - detect new methods     (LOG)
#
# - detect removed methods (WARN)
#
# - for existing methods:
#       - check code hash changes     (LOG)
#       - add new parameters          (LOG)
#       - check if parameters removed (WARN)
#
# - detect new DEFAULT_ARGS     (LOG)
#
# - detect removed DEFAULT_ARGS (WARN)
#

sub new {
    my ($class, $file, $jsobject) = @_;
    my $filename = basename $file;
    my $self = { filename    => $filename,
                 jsobject    => $jsobject,
                 newobjects  => 0,
                 delobjects  => 0,
                 newmethods  => 0,
                 delmethods  => 0,
                 newargs     => 0,
                 delargs     => 0,
                 newevents   => 0,
                 delevents   => 0,
                 newparams   => 0,
                 delparams   => 0,
                 newxxx      => 0,
                 log         => [],
               };
    bless $self, $class;
    $self->parseFile($file);
    return $self;
}

sub DESTROY {
    my ($self) = @_;
    $self->{tree}->delete;
}

sub parseFile {
    my ($self, $file) = @_;

    my $tree;

    if (-f $file) {
        $tree = DynarchLIB::XML_TreeBuilder->new;
        open FILE, '<', $file;
        local $/ = undef;
        my $content = <FILE>;
        close FILE;
        $content = encode('utf8', $content);
        $content =~ s/^\s+//;
        $content =~ s/\s+$//;
        $tree->parse($content);
        $tree->eof;
        $self->{existing} = 1;
    } else {
        $tree = XML::Element->new('api', file => $self->{jsobject}->{filename});
        $self->{existing} = 0;
    }

    $self->{tree} = $tree;
}

sub update {
    my ($self) = @_;
    my $tree = $self->{tree};
    my $jsobject = $self->{jsobject};

    my ($q, $w) = $self->check_nodes( node => $tree,
                                      tag  => 'object',
                                      list => $jsobject->{objects},
                                      foreach => sub {
                                          my ($node, $m, $new) = @_;
                                          if ($node->attr('base') && $node->attr('base') ne $m->{base}) {
                                              $self->XXX($node, 'BASE class changed!');
                                          }
                                          $node->attr(base => $m->{base});
                                          $self->check_object($node, $m, $new);
                                      }
                                    );
    $self->{newobjects} += @$q;
    $self->{delobjects} += @$w;
}

sub check_object {
    my ($self, $node, $obj) = @_;

    # (1) check DEFAULT_ARGS or constructor arguments
    my $ctor_node = $node->look_down(_tag => 'constructor');
    if (!$ctor_node) {
        $ctor_node = XML::Element->new('constructor');
        $node->push_content($ctor_node);
    }

    {
        my @params;
        if ($obj->{default_args}) {
            @params = @{$obj->{default_args}};
        } else {
            @params = @{$obj->{constructor}{params}};
            @params = map { { name => $_ } } @params;
        }
        my ($q, $w) = $self->check_nodes( node => $ctor_node,
                                          tag  => 'param',
                                          list => \@params,
                                          foreach => sub {
                                              my ($node, $p, $new) = @_;
                                              my $default = $p->{default};
                                              if (defined $default) {
                                                  $default =~ s{\n}{¶}g;
                                                  $node->attr('default', $default);
                                              }
#                                               my $default = $node->look_down(_tag => 'default',
#                                                                              sub {
#                                                                                  $_[0]->parent == $node;
#                                                                              });
#                                               if (defined $p->{default}) {
#                                                   if (!$default) {
#                                                       $default = XML::Element->new('default');
#                                                       $node->unshift_content($default);
#                                                   }
#                                                   $default->delete_content;
#                                                   $default->push_content($p->{default});
#                                               } elsif ($default) {
#                                                   $self->XXX($default, 'Removed from code');
#                                               }
                                          }
                                        );
        $self->{newargs} += @$q;
        $self->{delargs} += @$w;
    }

    # (2) check events
    my $events_node = $node->look_down(_tag => 'events', sub {
                                           $_[0]->parent == $node;
                                       });
    if ($obj->{default_events}) {
        if (!$events_node) {
            $events_node = XML::Element->new('events');
            $node->push_content($events_node);
        }
        my @events = map { { name => $_ } } @{$obj->{default_events}};
        my ($q, $w) = $self->check_nodes( node => $events_node,
                                          tag  => 'event',
                                          list => \@events,
                                          doc  => 1,
                                        );
        $self->{newevents} += @$q;
        $self->{delevents} += @$w;
    } elsif ($events_node) {
        $self->log('NO EVENTS! -- should remove <events>?');
        $events_node->attr(removed => 1);
        $self->XXX($events_node, 'No events in the code!');
    }

    # (3) check static methods

    my $static_methods_node = $node->look_down(_tag => 'static-methods', sub {
                                                   $_[0]->parent == $node;
                                               });
    if ($obj->{static_methods}) {
        if (!$static_methods_node) {
            $static_methods_node = XML::Element->new('static-methods');
            $node->push_content($static_methods_node);
        }
        my ($q, $w) = $self->check_nodes( node => $static_methods_node,
                                          tag  => 'method',
                                          list => $obj->{static_methods},
                                          doc  => 1,
                                          foreach => sub {
                                              my ($node, $m, $new) = @_;
                                              $self->check_method($node, $m, $new);
                                          }
                                        );
        $self->{newmethods} += @$q;
        $self->{delmethods} += @$w;
    } elsif ($static_methods_node) {
        $self->log('NO STATIC METHODS! -- should remove <static-methods>?');
        $static_methods_node->attr(removed => 1);
        $self->XXX($static_methods_node, 'No static methods in the code!');
    }

    # (4) check object methods

    my $object_methods_node = $node->look_down(_tag => 'object-methods', sub {
                                                   $_[0]->parent == $node;
                                               });
    if ($obj->{object_methods}) {
        if (!$object_methods_node) {
            $object_methods_node = XML::Element->new('object-methods');
            $node->push_content($object_methods_node);
        }
        my ($q, $w) = $self->check_nodes( node => $object_methods_node,
                                          tag  => 'method',
                                          list => $obj->{object_methods},
                                          doc  => 1,
                                          foreach => sub {
                                              my ($node, $m, $new) = @_;
                                              $self->check_method($node, $m, $new);
                                          }
                                        );
        $self->{newmethods} += @$q;
        $self->{delmethods} += @$w;
    } elsif ($object_methods_node) {
        $self->log('NO OBJECT METHODS! -- should remove <object-methods>?');
        $object_methods_node->attr(removed => 1);
        $self->XXX($object_methods_node, 'No object methods in the code!');
    }
}

sub check_method {
    my ($self, $node, $m, $new) = @_;
    ## $node should definitely exist at this stage
    my @params = map { { name => $_ } } @{$m->{params}};
    my ($q, $w) = $self->check_nodes(node => $node,
                                     tag  => 'param',
                                     list => \@params,
                                    );
    $self->{newparams} += @$q;
    $self->{delparams} += @$w;
    if ($new) {
        $self->{newmethods}++;
        $node->attr(hash => $m->{codehash});
        if ($m->{use_arguments}) {
            $node->unshift_content([ '~literal', { text => "<!--XXX: uses *arguments*, check for missing params-->" } ]);
        }
    } elsif ($node->attr('hash') ne $m->{codehash}) {
        my $doc = $node->look_down(_tag => 'doc',
                                   sub {
                                       $_[0]->parent == $node;
                                   });
        if ($doc && $doc->as_text() =~ /\S/) {
            # documentation exists
            $self->XXX($node, 'Code has changed!');
        }
        $node->attr(hash => $m->{codehash});
    }
    if ($m->{use_arguments} && !defined($node->attr('varargs'))) {
        $node->attr(varargs => 1);
    }
}

sub check_nodes {
    my ($self, %args) = @_;
    my $node = $args{node};
    my $tag = $args{tag};
    my $update_attr = $args{code};
    my @a = @{$args{list}};
    my @b = $node->look_down(_tag => $tag,
                             sub {
                                 $_[0]->parent == $node;
                             });
    my %a_by_name = map { ( $_->{name}, $_ ) } @a;
    my %b_by_name = map { ( $_->attr('name'), $_ ) } @b;

    my @added = ();
    my @removed = ();

    # process object nodes
    foreach my $o (@a) {
        my $name = $o->{name};
        my $n = $b_by_name{$name};
        my $new = !$n;
        if ($new) {
            ## no node, create
            $n = XML::Element->new($tag, name => $name);
            if ($o->{internal}) {
                $n->attr(internal => 1);
            }
            if ($o->{undoc}) {
                $n->attr(undoc => 1);
            }
            $node->push_content($n);
            if ($update_attr) {
                $update_attr->($n, $o);
            }
            push @added, $node;
            $self->log('NEW: %s / %s : %s', $node->tag, $tag, $name);
        }
        if ($args{foreach}) {
            $args{foreach}->($n, $o, $new);
        }
        if ($new) {
            if ($args{doc}) {
                $n->push_content([ 'doc' ]);
            }
        }
    }

    # process DOM nodes
    foreach my $n (@b) {
        my $name = $n->attr('name');
        my $o = $a_by_name{$name};
        if (!$o) {
            ## removed from code, warn
            if (!$n->attr('forced')) {
                $self->XXX($n, 'removed from code');
                $n->attr(removed => 1);
            }
            if ($update_attr) {
                $update_attr->($n);
            }
            if (!$n->attr('forced')) {
                push @removed, $node;
                $self->log('DEL: %s / %s : %s', $node->tag, $tag, $name);
            }
        }
    }

    return (\@added, \@removed);
}

sub XXX {
    my ($self, $node, $text) = @_;
    $self->{newxxx}++;
    $node->attr(XXX => $text);
}

sub getXML {
    my ($self) = @_;
    my $xml = $self->{tree}->as_HTML('<>', undef, {});
    $xml =~ s/&nbsp;/&amp;nbsp;/g; # HORRIBLE HACK! :(
    if (!$self->{existing}) {
        ## don't touch formatting for existing files
        my $twig = XML::Twig->new( pretty_print => 'indented',
                                   keep_spaces  => 0 );
        $twig->parse($xml);
        $xml = $twig->sprint;
    }
    $xml =~ s/^\s+//;
    $xml =~ s/\s+$//;
    $xml =~ s/<!--\s*XXX:\s*(.*?)\s*-->/<!--XXX: $1-->/sg;
    return $xml;
}

sub debug {
    my ($self, $format, @args) = @_;
    my $str = sprintf($format, @args);
    print STDERR "XML DEBUG ($self->{filename}): $str\n";
}

sub log {
    my ($self, $format, @args) = @_;
    my $str = sprintf($format, @args);
    push @{$self->{log}}, $str;
}

sub get_children_indent {
    my ($self, $node) = @_;
    return '  ' x $node->depth;
}

1;
