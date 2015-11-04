# script-extractor

Extracts structured information from a movie script.

## Quickstart

You will need to have Rust and Cargo installed.  Use `multirust` if
your system packages are too old.

```
$ pdftohtml -xml <some-script>.pdf
$ cargo run <some-script>.xml
```
