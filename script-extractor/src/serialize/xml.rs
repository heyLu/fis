//! Serialize `Script`s to `xml`

/// Serialize the given `Script` into a `xml`
///
/// Serialize the given `Script` into the following `xml` format and write
/// it to the given `Writer`.
///
/// # Example
///
/// ```xml
/// <?xml version="1.0" encoding="UTF-8"?>
/// <script>
///   <scene>
///     <location place="Snowy Landscape" type="external">
///       <direction page="1">Swirls of snow obscure the rocky formations of a mountain (...)</direction>
///       <direction page="1">Five ragged men attack a young girl, SINTEL, (...)</direction>
///       <!-- (...) -->
///       <dialog character="Shaman" page="1">You’re lucky to be alive. (...)</dialog>
///       <direction page="2">Finally she collapses into the snow, her eyes shut tight.</direction>
///       <direction page="2">BLACK</direction>
///       <dialog character="Shaman" mode="VO" page="2">Here, take a sip.</dialog>
///     </location>
///   </scene>
///   <!-- (...) -->
/// </script>
/// ```
pub fn format_script<W: Write>(scenes: &Script, output: &mut W) -> XmlResult<()> {
    let mut writer = EmitterConfig::new().perform_indent(true).create_writer(output);

    try!(writer.write(XmlEvent::start_element("script")));

    for scene in scenes.iter() {
        try!(writer.write(XmlEvent::start_element("scene")));

        for location in scene.iter() {
            let mut location_event = XmlEvent::start_element("location");
            if location.name.len() > 0 {
                location_event = location_event.attr("place", &location.name);
            }
            match location.kind {
                LocationType::Undefined => {}
                ref kind => {
                    location_event = location_event.attr("type", kind.clone().into());
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


use ::{DialogPart, LocationType, ScenePart, Script};
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
                                           .attr("character", speaker)
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
