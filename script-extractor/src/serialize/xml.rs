use parse::{ScenePart, DialogPart, Scene, LocationType};

use std::io::Write;
use xml::{EventWriter, EmitterConfig};
use xml::writer::Result as XmlResult;
use xml::writer::XmlEvent;

fn format_scene_parts<W: Write>(scene_parts: &Vec<ScenePart>, writer: &mut EventWriter<W>) -> XmlResult<()> {
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

pub fn format_scenes<W: Write>(scenes: &Vec<Scene>, output: &mut W) -> XmlResult<()> {
    let mut writer = EmitterConfig::new().perform_indent(true).create_writer(output);

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
