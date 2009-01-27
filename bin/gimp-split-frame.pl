#! /usr/bin/perl -w

use Gimp qw(:auto __ N_);
use Gimp::Fu;
use File::Path;
use Data::Dumper;

sub doit {
    my ($img, $drawable, $path, $prefix) = @_;

    $path ||= '/tmp/shadows';

    mkpath($path);

    $img = $img->duplicate;
    $img->undo_disable;

    my ($W, $H) = ($img->width, $img->height);

    my $layer = $img->merge_visible_layers(EXPAND_AS_NECESSARY);
    Plugin->autocrop($img, $layer);

    my (@hguides, @vguides);
    my $i = $img->find_next_guide(0);
    while ($i) {
        my $pos = $img->get_guide_position($i);
        if ($img->get_guide_orientation($i) == ORIENTATION_HORIZONTAL) {
            push @hguides, $pos;
        } else {
            push @vguides, $pos;
        }
        $i = $img->find_next_guide($i);
    }

    @hguides = sort { $a <=> $b } @hguides;
    @vguides = sort { $a <=> $b } @vguides;

    unshift @hguides, 0
      if $hguides[0] != 0;
    push @hguides, $H
      if $hguides[$#hguides] != $H;

    unshift @vguides, 0
      if $vguides[0] != 0;
    push @vguides, $W
      if $vguides[$#vguides] != $W;

    print STDERR "Horiz:\n";
    print STDERR join("\n", @hguides), "\n";

    print STDERR "Vert:\n";
    print STDERR join("\n", @vguides), "\n";

    my @files = (
                 { name => 'TL.png',
                   sel => [ $vguides[0], $hguides[0], $vguides[1] - $vguides[0], $hguides[1] - $hguides[0] ],
                 },
                 { name => 'T.png',
                   sel => [ $vguides[1], $hguides[0], $vguides[2] - $vguides[1], $hguides[1] - $hguides[0] ],
                   cut => { x => 16 },
                 },
                 { name => 'TR.png',
                   sel => [ $vguides[2], $hguides[0], $vguides[3] - $vguides[2], $hguides[1] - $hguides[0] ],
                 },
                 { name => 'R.png',
                   sel => [ $vguides[2], $hguides[1], $vguides[3] - $vguides[2], $hguides[2] - $hguides[1] ],
                   cut => { y => 16 },
                 },
                 { name => 'BR.png',
                   sel => [ $vguides[2], $hguides[2], $vguides[3] - $vguides[2], $hguides[3] - $hguides[2] ],
                 },
                 { name => 'B.png',
                   sel => [ $vguides[1], $hguides[2], $vguides[2] - $vguides[1], $hguides[3] - $hguides[2] ],
                   cut => { x => 16 },
                 },
                 { name => 'BL.png',
                   sel => [ $vguides[0], $hguides[2], $vguides[1] - $vguides[0], $hguides[3] - $hguides[2] ],
                 },
                 { name => 'L.png',
                   sel => [ $vguides[0], $hguides[1], $vguides[1] - $vguides[0], $hguides[2] - $hguides[1] ],
                   cut => { y => 16 },
                 }
                );

    my $hash = {};

    foreach my $f (@files) {
        my $name = $f->{name};
        my $class = $f->{class};
        if (!$class) {
            ($class = $name) =~ s/\..*$//;
        }
        $hash->{$class} = $f;
        $f->{css} = {};

        my @sel = @{$f->{sel}};

        # add some required arguments (2 for REPLACE)
        push @sel, 2, 0, 0;

        # select
        $img->rect_select(@sel);
        my $width = $sel[2];
        my $height = $sel[3];

	print STDERR "$width x $height (" . join(", ", @sel) . ")\n";

        # copy selection
        $layer->edit_copy();

        # create new image
        my $cut = Gimp->image_new($width, $height, $img->base_type);
        $cut->undo_disable;
        my $lay = Gimp->layer_new($cut, $width, $height, $img->base_type, "Foo", 100, NORMAL_MODE);
        $cut->add_layer($lay, 0);

        if (!$lay->has_alpha) {
            $lay->add_alpha;
        }

        $lay->edit_clear;

        # paste selection & anchor
        $lay->edit_paste(0)->anchor();

        $f->{origsize} = { x => $width, y => $height };

        Plugin->autocrop($cut, $lay);

        $width = $cut->width;
        $height = $cut->height;

        if ($f->{cut}) {
            $cut->crop($f->{cut}{x} || $width,
                       $f->{cut}{y} || $height,
                       0, 0);
        }

        $width = $cut->width;
        $height = $cut->height;

        $f->{finalsize} = { x => $width, y => $height };

        $f->{css}{background} = qq{url("$name") };
        if ($class eq 'L' || $class eq 'R') {
            $f->{css}{background} .= 'repeat-y';
            $f->{css}{width} = "${width}px";
            $f->{diff} = $f->{origsize}{x} - $width;
        } elsif ($class eq 'T' || $class eq 'B') {
            $f->{css}{background} .= 'repeat-x';
            $f->{css}{height} = "${height}px";
            $f->{diff} = $f->{origsize}{y} - $height;
        } else {
            $f->{css}{background} .= 'no-repeat';
            $f->{css}{width} = "${width}px";
            $f->{css}{height} = "${height}px";
        }
        $f->{css}{background} .= ' 0 0';

        # Gimp->display_new($cut);

        # save the image
        # $cut->Gimp::Fu::save_image("/tmp/$name", "/tmp/$name");
        $lay->file_png_save("$path/$name", "$path/$name", 0, 9, 0, 0, 0, 0, 0);

        # delete the temp. image
        $cut->delete;
    }

    ## let's generate some CSS now.

    #### TOP stuff

    $hash->{T}{css}{left} = $hash->{L}{diff} . 'px';
    $hash->{T}{css}{right} = $hash->{R}{diff} . 'px';
    $hash->{T}{css}{top} = '-' . $hash->{T}{finalsize}{y} . 'px';

    $hash->{R}{css}{top} = $hash->{T}{diff} . 'px';
    $hash->{R}{css}{bottom} = $hash->{B}{diff} . 'px';
    $hash->{R}{css}{right} = '-' . $hash->{R}{finalsize}{x} . 'px';

    $hash->{L}{css}{top} = $hash->{T}{diff} . 'px';
    $hash->{L}{css}{bottom} = $hash->{B}{diff} . 'px';
    $hash->{L}{css}{left} = '-' . $hash->{L}{finalsize}{x} . 'px';

    $hash->{B}{css}{left} = $hash->{L}{diff} . 'px';
    $hash->{B}{css}{right} = $hash->{R}{diff} . 'px';
    $hash->{B}{css}{bottom} = '-' . $hash->{B}{finalsize}{y} . 'px';

    $hash->{TL}{css}{left} = '-' . ( $hash->{TL}{finalsize}{x} - $hash->{L}{diff} ) . 'px';
    $hash->{TL}{css}{top} = '-' . ( $hash->{TL}{finalsize}{y} - $hash->{T}{diff} ) . 'px';

    $hash->{TR}{css}{right} = '-' . ( $hash->{TR}{finalsize}{x} - $hash->{R}{diff} ) . 'px';
    $hash->{TR}{css}{top} = '-' . ( $hash->{TR}{finalsize}{y} - $hash->{T}{diff} ) . 'px';

    $hash->{BR}{css}{right} = '-' . ( $hash->{BR}{finalsize}{x} - $hash->{R}{diff} ) . 'px';
    $hash->{BR}{css}{bottom} = '-' . ( $hash->{BR}{finalsize}{y} - $hash->{B}{diff} ) . 'px';

    $hash->{BL}{css}{left} = '-' . ( $hash->{BL}{finalsize}{x} - $hash->{L}{diff} ) . 'px';
    $hash->{BL}{css}{bottom} = '-' . ( $hash->{BL}{finalsize}{y} - $hash->{B}{diff} ) . 'px';

    open CSS, "> $path/shadows.css";
    while (my ($class, $f) = each %$hash) {
        print CSS "$prefix$class { ";
        print CSS join('; ', ( map { $_ . ': ' . $f->{css}{$_} } keys %{$f->{css}} )), "; }\n";
    }

    print CSS "\n\n/*\n";
    print CSS Data::Dumper::Dumper($hash);
    print CSS "*/\n";

    close CSS;

    # $img->rect_select(0, 0, $img->get_guide_position($vguides[0]), $img->get_guide_position($hguides[0]), 0, 0, 0);

    $img->delete;

    ();
}

register "split_shadow",
  "Splits a shadow into small images suitable for CSS-based shadows",
  "HELP",
  "Mishoo",
  "(c) Mihai Bazon 2007",
  "Today",
  N_"<Image>/Image/Split Shadow",
  "*",
  [
   [ PF_FILE, 'basedir', 'Destination path...', '/tmp/shadows' ],
   [ PF_STRING, 'prefix', 'Prefix for CSS classes', '' ]
  ],
  \&doit;

exit main;
