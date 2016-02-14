# script-extractor

Extracts structured information from a movie script.

## Quickstart

You will need to have Rust and Cargo installed.  Use `multirust` if
your system packages are too old.

```
$ pdftohtml -i -xml <some-script>.pdf
$ cargo build
$ target/debug/script-extractor --json <some-script>.xml > <some-script>.json
```

## Documentation

Either use the [online docs] or generate them offline using cargo:
```
$ cargo doc --no-deps --open
```

[online docs]: https://heylu.github.io/fis/docs/script_extractor/
