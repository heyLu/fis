#[macro_use]
extern crate clap;
extern crate regex;
extern crate xml;

pub mod parse;
pub mod serialize;

use clap::{App, Arg};
use std::fs::File;
use std::io::BufReader;

fn main() {
    let args = App::new("script-extractor")
                   .version(&crate_version!())
                   .about("Parse movie scripts (pdf) to a structured format (xml)")
                   .arg(Arg::with_name("input-file")
                            .help("xml extracted using 'pdftohtml -xml script.pdf'")
                            .index(1)
                            .required(true)
                            .validator(check_file_exists))
                   .get_matches();

    let input_file = args.value_of("input-file").unwrap();

    let file_reader = File::open(input_file).expect("Cannot open file");
    let buffered_file_reader = Box::new(BufReader::new(file_reader));

    let scenes = parse::parse_script(buffered_file_reader);

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
