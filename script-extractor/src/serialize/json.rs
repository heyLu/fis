//! Serialize `Script`s to `json`

/// Serialize the given `Script` into a `json`
///
/// Serialize the given `Script` into the following `json` format and write
/// it to the given `Writer`.
///
/// # Example
///
/// ```json
/// [
///     [
///         {
///             "place": "Snowy Landscape",
///             "type": "external",
///             "parts": [{
///                 "page": 1,
///                 "direction": "Swirls of snow obscure the rocky formations of a mountain (...)"
///             },{
///                 "page": 1,
///                 "direction": "Five ragged men attack a young girl, SINTEL, (...)"
///             },{
///                 "page": 1,
///                 "character": "Shaman",
///                 "dialog": [
///                     "You’re lucky to be alive. (...)"
///                 ]
///             },{
///                 "page": 2,
///                 "direction": "Finally she collapses into the snow, her eyes shut tight."
///             },{
///                 "page": 2,
///                 "direction": "BLACK"
///             },{
///                 "page": 2,
///                 "character": "Shaman",
///                 "mode": "VO",
///                 "dialog": [
///                     { "direction": "(To Sintel)" },
///                     "Here, take a sip."
///                 ]
///             }]
///         }
///     ]
/// ]
/// ```
pub fn format_script<W: Write>(scenes: &Script, output: &mut W) -> json::EncodeResult<()> {
    let mut writer = IoFmtWriter { writer: output };
    let mut encoder = json::Encoder::new_pretty(&mut writer);

    try!(scenes.encode(&mut encoder));

    Ok(())
}


use ::{DialogPart, Location, LocationType, ScenePart, Script};
use rustc_serialize::Encodable;
use rustc_serialize::{Encoder, json};
use std::io::Write;
use std::fmt;

/// Needed because rustc-serialize uses fmt::Write instead of io::Write.
/// See https://github.com/rust-lang-nursery/rustc-serialize/issues/111
struct IoFmtWriter<'a> {
    writer: &'a mut Write
}

/// Pass all writes to the underlying io::Write.
impl<'a> fmt::Write for IoFmtWriter<'a> {
    fn write_str(&mut self, s: &str) -> Result<(), fmt::Error> {
        if let Err(_) = self.writer.write_all(s.as_bytes()) {
            Err(fmt::Error)
        } else {
            Ok(())
        }
    }
}

/// Flush the underlying io::Write when dropping the object.
impl<'a> Drop for IoFmtWriter<'a> {
    fn drop(&mut self) {
        self.writer.flush().ok();
    }
}

impl Encodable for Location {
    fn encode<S: Encoder>(&self, s: &mut S) -> Result<(), S::Error> {
        s.emit_map(3, |s| {
            try!(emit_map_key_val(s, 0, "place", |s| self.name.encode(s)));
            match self.kind {
                LocationType::Undefined => {}
                ref kind => {
                    let kind: &str = kind.clone().into();
                    try!(emit_map_key_val(s, 1, "type", |s| kind.encode(s)));
                }
            }
            try!(emit_map_key_val(s, 2, "parts", |s| self.parts.encode(s)));
            Ok(())
        })
    }
}

impl Encodable for ScenePart {
    fn encode<S: Encoder>(&self, s: &mut S) -> Result<(), S::Error> {
        match self {
            &ScenePart::Direction { ref direction, ref page } => {
                s.emit_map(2, |s| {
                    try!(emit_map_key_val(s, 0, "page", |s| page.encode(s)));
                    try!(emit_map_key_val(s, 1, "direction", |s| direction.encode(s)));
                    Ok(())
                })
            }
            &ScenePart::Dialog { ref speaker, ref dialog, ref page } => {
                s.emit_map(3, |s| {
                    try!(emit_map_key_val(s, 0, "page", |s| page.encode(s)));
                    try!(emit_map_key_val(s, 1, "character", |s| speaker.encode(s)));
                    try!(emit_map_key_val(s, 2, "dialog", |s| dialog.encode(s)));
                    Ok(())
                })
            }
        }
    }
}

impl Encodable for DialogPart {
    fn encode<S: Encoder>(&self, s: &mut S) -> Result<(), S::Error> {
        match self {
            &DialogPart::Dialog(ref dialog) => {
                s.emit_str(dialog)
            }
            &DialogPart::Direction(ref direction) => {
                s.emit_map(1, |s| {
                    emit_map_key_val(s, 0, "direction", |s| direction.encode(s))
                })
            }
        }
    }
}

/// Convenience function for emitting both key and value of a map entry
fn emit_map_key_val<S, F>(s: &mut S, idx: usize, key: &str, f: F) -> Result<(), S::Error>
    where S: Encoder,
          F: FnOnce(&mut S) -> Result<(), S::Error> {
    try!(s.emit_map_elt_key(idx, |s| key.encode(s)));
    try!(s.emit_map_elt_val(idx, f));
    Ok(())
}
