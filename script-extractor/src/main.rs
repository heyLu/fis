extern crate xml;
extern crate regex;

use std::collections::HashMap;
use std::env;
use std::fs::File;
use std::io::Read;
use std::io::Write;
use std::io::BufReader;

use xml::{EventReader, EventWriter};
use xml::reader::XmlEvent;
use xml::writer::Result as XmlResult;
use xml::attribute::OwnedAttribute;

#[derive(Debug, Clone, Default)]
struct LineAttributes {
    top: i32,
    left: i32,
    height: i32,
    page: u32,
}

fn read_attributes(attr_list: &Vec<OwnedAttribute>) -> LineAttributes {
    let mut attributes : LineAttributes = Default::default();

    for attr in attr_list {
        match attr.name.local_name.as_ref() {
            "top" => attributes.top = attr.value.parse().unwrap(),
            "left" => attributes.left = attr.value.parse().unwrap(),
            "height" => attributes.height = attr.value.parse().unwrap(),
            _ => {}
        }
    }

    attributes
}

#[derive(Debug, Clone, Default)]
struct ScriptProperties {
    direction_position: i32,
    dialog_position: i32,
    speaker_direction_position: i32,
    speaker_position: i32,
    intra_paragraph_line_height: i32,
}

fn read_and_analyze_script(reader: Box<Read>) -> (ScriptProperties, Vec<(LineAttributes, String)>) {
    let mut script_properties: ScriptProperties = Default::default();
    let mut lines: Vec<(LineAttributes, String)> = Vec::new();

    // these maps are used to heuristically determine the ScriptProperties
    let mut position_uses: HashMap<i32, u32> = HashMap::new();
    let mut line_height_uses: HashMap<i32, u32> = HashMap::new();

    // states for the streaming xml parsing
    let mut current_line_attributes: LineAttributes = Default::default();
    let mut current_text_buffer = String::new();
    let mut current_page_number = 0;
    let mut last_line_height = 0;

    let parser = EventReader::new(reader);
    for event in parser {
        match event {
            Ok(XmlEvent::StartElement { name, attributes, .. }) => {
                match name.local_name.as_ref() {
                    "text" => {
                        current_line_attributes = read_attributes(&attributes);

                        current_text_buffer.clear();

                        // increase the count for the current left margin
                        *position_uses.entry(current_line_attributes.left)
                                      .or_insert(0) += 1;

                        // increase the count for the current top position diff
                        *line_height_uses.entry(current_line_attributes.top - last_line_height)
                                         .or_insert(0) += 1;
                        last_line_height = current_line_attributes.top;
                    }
                    "page" => {
                        last_line_height = 0;

                        for attr in attributes {
                            if "number" == attr.name.local_name {
                                current_page_number = attr.value.parse().unwrap();
                                break;
                            }
                        }
                    }
                    _ => {}
                }
            }
            Ok(XmlEvent::Characters(text)) => {
                if current_text_buffer.len() > 0 {
                    current_text_buffer.push(' ');
                }
                current_text_buffer.push_str(text.trim());
            }
            Ok(XmlEvent::EndElement { name, .. }) => {
                if name.local_name == "text" {
                    current_line_attributes.page = current_page_number;
                    lines.push((current_line_attributes.clone(), current_text_buffer.clone()));
                }
            }
            Ok(_) => {},
            Err(e) => panic!("Error parsing xml: {}", e),
        }
    }

    // the position_uses map should at least have 3 different entries
    if position_uses.len() < 3 {
        panic!("Script uses strange layout");
    }

    // copy the position uses map into a vector and sort by value desc
    let mut position_uses_vec = position_uses.into_iter().collect::<Vec<_>>();
    position_uses_vec.sort_by(|&a, &b| b.1.cmp(&a.1));

    // sort the top 3 entries by position again (right-exclusive range)
    position_uses_vec[0..3].sort_by(|&a, &b| b.0.cmp(&a.0));

    script_properties.speaker_position = position_uses_vec[0].0;
    script_properties.dialog_position = position_uses_vec[1].0;
    script_properties.direction_position = position_uses_vec[2].0;

    // take the next value between speaker and dialog as speaker_direction
    for &value in position_uses_vec.iter().skip(3) {
        let (position, _) = value;
        if position > script_properties.dialog_position &&
           position < script_properties.speaker_position {
            script_properties.speaker_direction_position = position;
            break;
        }
    }

    // use to most used line diff value to determine the specific sections
    let mut last_uses: u32 = 0;
    for (&line_height, &uses) in line_height_uses.iter() {
        if uses > last_uses {
            script_properties.intra_paragraph_line_height = line_height;
            last_uses = uses;
        }
    }

    (script_properties, lines)
}

#[derive(Debug, Clone)]
enum DialogPart {
    Dialog(String),
    Direction(String),
}

#[derive(Debug, Clone)]
enum ScenePart {
    Direction {
        direction: String,
        page: u32,
    },
    Dialog {
        speaker: String,
        dialog: Vec<DialogPart>,
        page: u32,
    }
}

#[derive(Debug, Clone)]
enum ScriptPart {
    Separator,
    ScenePart(ScenePart),
    LocationChange(String),
    SceneChange,
}

fn is_location_change(line: &str) -> bool {
    line.starts_with("INT.") || line.starts_with("EXT.")
}

fn is_scene_change(line: &str) -> bool {
    line.starts_with("CUT TO")
}

fn extract_script_parts(properties: ScriptProperties, lines: &Vec<(LineAttributes, String)>)
    -> Vec<ScriptPart> {
    let mut script_parts: Vec<ScriptPart> = Vec::new();
    let mut last_top_position = 0;

    for line in lines.iter() {
        let &(ref attributes, ref line) = line;

        if line.len() == 0 {
            continue;
        }

        // check if a new section starts
        if attributes.top - last_top_position > 18 ||
           attributes.top - last_top_position < 0 {
            // used to separate two consecutive script parts of the
            // same type. this is just a implementation detail of
            // the parsing. the Separator can be ignored later.
            script_parts.push(ScriptPart::Separator);
        }

        if attributes.left == properties.direction_position {
            if is_location_change(line) {
                script_parts.push(ScriptPart::LocationChange(line.clone()));
            } else {
                // ensure the last script part is a direction
                if let Some(&ScriptPart::ScenePart(ScenePart::Direction{..})) = script_parts.last() {
                } else {
                    script_parts.push(ScriptPart::ScenePart(
                        ScenePart::Direction{
                            direction: String::new(),
                            page: attributes.page,
                        }));
                }

                if let Some(&mut ScriptPart::ScenePart(ScenePart::Direction{ref mut direction, ..})) = script_parts.last_mut() {
                    if direction.len() > 0 {
                        direction.push(' ');
                    }
                    direction.push_str(line);
                }
            }
        } else if attributes.left == properties.speaker_position ||
                  attributes.left == properties.speaker_direction_position ||
                  attributes.left == properties.dialog_position {
            // Ensure the last script part is a dialog
            if let Some(&ScriptPart::ScenePart(ScenePart::Dialog{..})) = script_parts.last() {
            } else {
                script_parts.push(ScriptPart::ScenePart(
                    ScenePart::Dialog{
                        speaker: String::new(),
                        dialog: Vec::new(),
                        page: attributes.page,
                    }));
            }

            // get the dialog, should never fail (see above)
            if let Some(&mut ScriptPart::ScenePart(ScenePart::Dialog{ref mut speaker, ref mut dialog, ..})) = script_parts.last_mut() {
                if attributes.left == properties.speaker_position {
                    // there is only one speaker per dialog
                    speaker.push_str(line);
                } else if attributes.left == properties.speaker_direction_position {
                    if let Some(&DialogPart::Direction(_)) = dialog.last() {
                    } else {
                        dialog.push(DialogPart::Direction(String::new()));
                    }

                    if let Some(&mut DialogPart::Direction(ref mut direction)) = dialog.last_mut() {
                        if direction.len() > 0 {
                            direction.push(' ');
                        }
                        direction.push_str(line);
                    }
                } else if attributes.left == properties.dialog_position {
                    if let Some(&DialogPart::Dialog(_)) = dialog.last() {
                    } else {
                        dialog.push(DialogPart::Dialog(String::new()));
                    }

                    if let Some(&mut DialogPart::Dialog(ref mut dialog)) = dialog.last_mut() {
                        if dialog.len() > 0 {
                            dialog.push(' ');
                        }
                        dialog.push_str(line);
                    }
                }
            }
        } else {
            if is_scene_change(line) {
                script_parts.push(ScriptPart::SceneChange);
            }
        }

        last_top_position = attributes.top;
    }

    script_parts
}

#[derive(Clone, Debug)]
enum LocationType {
    Undefined,
    Internal,
    External,
    InternalExternal,
}

impl Default for LocationType {
    fn default() -> LocationType { LocationType::Undefined }
}

impl std::ops::Deref for LocationType {
    type Target = str;
    fn deref(&self) -> &str {
        match *self {
            LocationType::Undefined => "",
            LocationType::Internal => "internal",
            LocationType::External => "external",
            LocationType::InternalExternal => "internal,external",
        }
    }
}

fn extract_location(name: &str) -> Location {
    let pattern = regex::Regex::new(r"(?:(?P<kind>INT\.|EXT\.|INT\./EXT\.)\s+)?(?P<location>.+)").unwrap();
    let mut location: Location = Default::default();

    if let Some(captures) = pattern.captures(name) {
        location.name = captures.name("location").unwrap().to_string();

        if let Some(location_kind) = captures.name("kind") {
            location.kind = match location_kind {
                "INT." => LocationType::Internal,
                "EXT." => LocationType::External,
                "INT./EXT." => LocationType::InternalExternal,
                _ => LocationType::Undefined,
            };
        }
    } else {
        location.name = name.to_string();
    }

    location
}

#[derive(Default, Clone, Debug)]
struct Location {
    kind: LocationType,
    name: String,
    parts: Vec<ScenePart>,
}

type Scene = Vec<Location>;

fn extract_scenes(script_parts: &Vec<ScriptPart>) -> Vec<Scene> {
    let mut scenes = Vec::new();

    // scene with default (empty) location
    let default_scene: Scene = vec![Default::default()];
    scenes.push(default_scene.clone());

    for script_part in script_parts.iter() {
        use ScriptPart::*;
        match script_part {
            &SceneChange => {
                // unwrap is save, see default_scene
                if scenes.last().unwrap().len() > 0 {
                    scenes.push(default_scene.clone());
                }
            }
            &LocationChange(ref location) => {
                // unwraps are safe, see default_scene
                let mut current_scene = scenes.last_mut().unwrap();

                if current_scene.last().unwrap().parts.len() == 0 {
                    current_scene.pop();
                }
                current_scene.push(extract_location(location));
            }
            &ScenePart(ref scene_part) => {
                let scene_parts = &mut scenes.last_mut().unwrap().last_mut().unwrap().parts;
                scene_parts.push(scene_part.clone());
            }
            &Separator => {} //ignore
        }
    }

    scenes
}

fn format_scene_parts<W: Write>(scene_parts: &Vec<ScenePart>, writer: &mut EventWriter<W>) -> XmlResult<()> {
    use xml::writer::XmlEvent;

    for part in scene_parts.iter() {
        match part {
            &ScenePart::Direction { ref direction, ref page } => {
                try!(writer.write(XmlEvent::start_element("direction")
                                           .attr("page", page.to_string().as_ref())));

                try!(writer.write(XmlEvent::characters(direction)));

                try!(writer.write(XmlEvent::end_element()));
            }
            &ScenePart::Dialog { ref speaker, ref dialog, ref page } => {
                try!(writer.write(XmlEvent::start_element("dialog")
                                           .attr("speaker", speaker)
                                           .attr("page", page.to_string().as_ref())));

                for (i, dialog_part) in dialog.iter().enumerate() {
                    match dialog_part {
                        &DialogPart::Dialog(ref dialog) => {
                            try!(writer.write(XmlEvent::characters(dialog)));
                        }
                        &DialogPart::Direction(ref direction) => {
                            try!(writer.write(XmlEvent::start_element("direction")));
                            try!(writer.write(XmlEvent::characters(direction)));
                            try!(writer.write(XmlEvent::end_element()));
                        }
                    }

                    if i + 1 != dialog.len() {
                        try!(writer.write(XmlEvent::characters(" ")));
                    }
                }

                try!(writer.write(XmlEvent::end_element()));
            }
        }
    }

    Ok(())
}

fn format_scenes<W: Write>(scenes: &Vec<Scene>, output: &mut W) -> XmlResult<()> {
    use xml::writer::XmlEvent;

    let mut writer = xml::EmitterConfig::new().perform_indent(true).create_writer(output);

    try!(writer.write(XmlEvent::start_element("script")));

    for scene in scenes.iter() {
        try!(writer.write(XmlEvent::start_element("scene")));

        for location in scene.iter() {
            let mut location_event = XmlEvent::start_element("location");
            if location.name.len() > 0 {
                location_event = location_event.attr("name", &location.name);
            }
            match location.kind {
                LocationType::Undefined => {}
                _ => {
                    location_event = location_event.attr("kind", &location.kind);
                }
            }
            try!(writer.write(location_event));

            try!(format_scene_parts(&location.parts, &mut writer));

            try!(writer.write(XmlEvent::end_element()));
        }

        try!(writer.write(XmlEvent::end_element()));
    }

    try!(writer.write(XmlEvent::end_element()));

    Ok(())
}

fn main() {
    let xml_file_name = env::args().skip(1).next().expect("No input file given");

    let file_reader = File::open(xml_file_name).expect("Could not open file");
    let buffered_file_reader = Box::new(BufReader::new(file_reader));

    let (properties, lines) = read_and_analyze_script(buffered_file_reader);

    format_scenes(&extract_scenes(&extract_script_parts(properties, &lines)), &mut std::io::stdout()).unwrap();
}
