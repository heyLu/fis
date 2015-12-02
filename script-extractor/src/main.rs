extern crate xml;
extern crate regex;

mod parse;
mod serialize;

use std::env;
use std::fs::File;
use std::io::BufReader;

fn main() {
    let xml_file_name = env::args().skip(1).next().expect("No input file given");

    let file_reader = File::open(xml_file_name).expect("Could not open file");
    let buffered_file_reader = Box::new(BufReader::new(file_reader));

    let (properties, lines) = parse::read_and_analyze_script(buffered_file_reader);

    serialize::xml::format_scenes(&parse::extract_scenes(&parse::extract_script_parts(properties, &lines)), &mut std::io::stdout()).unwrap();
}
