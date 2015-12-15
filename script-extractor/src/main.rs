#[macro_use]
extern crate clap;
extern crate regex;
extern crate xml;

pub mod parse;
pub mod serialize;

use clap::{App, Arg};
use std::fs::File;
use std::io::{BufReader, Read};

fn main() {
    let args = App::new("script-extractor")
                   .version(&crate_version!())
                   .about("Parse movie scripts (pdf) to a structured format (xml)")
                   .arg(Arg::with_name("input-file")
                            .help("xml extracted using 'pdftohtml -xml script.pdf'")
                            .index(1)
                            .validator(check_file_exists))
                   .get_matches();

    let mut input: Box<Read> = if let Some(input_file) = args.value_of("input-file") {
        let file_reader = File::open(input_file).expect("Cannot open input-file");
        Box::new(BufReader::new(file_reader))
    } else {
        Box::new(BufReader::new(std::io::stdin()))
    };

    let scenes = parse::parse_script(&mut input);

    serialize::xml::format_script(&scenes, &mut std::io::stdout()).unwrap();
}

fn check_file_exists(file_name: String) -> Result<(), String> {
    if let Ok(metadata) = std::fs::metadata(&file_name) {
        if metadata.is_file() && !metadata.permissions().readonly() {
            Ok(())
        } else {
            Err(format!("Cannot read file '{}'", file_name))
        }
    } else {
        Err(format!("File '{}' not found", file_name))
    }
}
