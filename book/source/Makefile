all:
	latexmk -f -pdf source.tex

view: all
	# xpdf source.pdf 1000
	gnome-open source.pdf 1000

clean:
	latexmk -C source.tex
	rm -f *.out
