//! Library to parse movie scripts and output them in a structured format

extern crate regex;
extern crate xml;

pub mod parse;
pub mod serialize;

/// A `Script` consists of a list of `Scene`s.
pub type Script = Vec<Scene>;

/// A `Scene` consists of a list of `Location`s.
///
/// Some scripts do not distinguish between scenes and locations and will
/// thus only have one `Scene` with several `Location`s or several `Scene`s
/// with each containing only one `Location`.
pub type Scene = Vec<Location>;

/// Represents a location in which part of a `Scene` takes place.
#[derive(Default, Clone, Debug)]
pub struct Location {
    /// The kind of the location (like internal)
    pub kind: LocationType,
    /// The name of the location
    pub name: String,
    /// The `Dialog` and `Direction` which take place in this location
    pub parts: Vec<ScenePart>,
}

/// Represents the types of locations often used in scripts.
#[derive(Clone, Debug)]
pub enum LocationType {
    Undefined,
    Internal,
    External,
    InternalExternal,
}

/// A `Scene` consists of `Direction`s and `Dialog`s.
///
/// Each `ScenePart` carries the page number from which it was extracted
/// originally.
#[derive(Debug, Clone)]
pub enum ScenePart {
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

/// The different parts of a `Dialog`.
///
/// A `DialogPart` can have inline `Direction`s in between normal `Dialog`.
#[derive(Debug, Clone)]
pub enum DialogPart {
    /// What a speaker says
    Dialog(String),
    /// How or to whom the speaker says it
    Direction(String),
}

/// The default for `LocationType` is `Undefined`.
impl Default for LocationType {
    fn default() -> LocationType { LocationType::Undefined }
}

/// Converts the `LocationType` into a string representation.
///
/// `Undefined` becomes the empty string.
impl Into<&'static str> for LocationType {
    fn into(self) -> &'static str {
        match self {
            LocationType::Undefined => "",
            LocationType::Internal => "internal",
            LocationType::External => "external",
            LocationType::InternalExternal => "internal,external",
        }
    }
}

/// Parses the given string into a range.
///
/// This is used when parsing the "--pages" cli argument.
///
/// # Examples
///
/// ```
/// assert_eq!(extract_range("42"), (42, 42));
/// assert_eq!(extract_range("3-15"), (3, 15));
/// assert_eq!(extract_range("foo"), (0, u32::max_value()));
/// ```
pub fn extract_range(range_string: &str) -> Option<(u32, u32)> {
    let range_regex = regex::Regex::new(r"^(?P<lower>\d+)-(?P<upper>\d+)$").unwrap();

    if let Ok(page) = range_string.parse() {
        return Some((page, page));
    } else if let Some(captures) = range_regex.captures(range_string) {
        if let (Ok(lower), Ok(upper)) = (captures.name("lower").unwrap().parse(),
                                         captures.name("upper").unwrap().parse()) {
            return Some((lower, upper));
        }
    }

    None
}

/// Filter the script using a range of pages.
///
/// The range is inclusive and empty scenes and locations are removed.
pub fn filter_script(script: Script, page_range: (u32, u32)) -> Script {
    let (lower, upper) = page_range;

    script.into_iter().filter_map(|scene| {
        let filtered_scene: Scene = scene.into_iter().filter_map(|mut location| {
            let filtered_scene_parts: Vec<ScenePart> = location.parts.into_iter().filter_map(|scene_part| {
                let page = match scene_part {
                    ScenePart::Direction { page, .. } => page,
                    ScenePart::Dialog { page, .. } => page
                };

                // filter using the given range
                if lower <= page && page <= upper {
                    Some(scene_part)
                } else {
                    None
                }
            }).collect();

            // filter out locations with no scene parts
            if filtered_scene_parts.len() > 0 {
                location.parts = filtered_scene_parts;
                Some(location)
            } else {
                None
            }
        }).collect();

        // filter out scenes with no locations
        if filtered_scene.len() > 0 {
            Some(filtered_scene)
        } else {
            None
        }
    }).collect()
}
