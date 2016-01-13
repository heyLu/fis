DEPS = narrative.js narrative.css

deps: $(DEPS)

$(DEPS):
	curl -o $@ https://csclub.uwaterloo.ca/~n2iskand/comics/narrative/$@

clean:
	rm -f $(DEPS)
