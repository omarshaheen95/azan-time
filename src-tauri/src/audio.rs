//! One player for the whole app: the adhan, the spoken lines and Settings' Play button. It lives on its own thread,
//! which owns the output stream; a new stream is opened for each sound so it follows the current default device
//! (headphones plugged in since the last prayer).

use std::fs::File;
use std::io::BufReader;
use std::path::PathBuf;
use std::sync::mpsc::{channel, Sender};
use std::thread;

use rodio::{Decoder, OutputStream, OutputStreamBuilder, Sink};

pub enum Cmd {
    Play(PathBuf, f32),
    Stop,
}

pub fn spawn() -> Sender<Cmd> {
    let (tx, rx) = channel::<Cmd>();
    thread::Builder::new()
        .name("audio".into())
        .spawn(move || {
            // Kept together: the sink plays only while its stream is alive.
            let mut current: Option<(OutputStream, Sink)> = None;
            for cmd in rx {
                if let Some((_, sink)) = current.take() {
                    sink.stop();
                }
                if let Cmd::Play(path, volume) = cmd {
                    match open(&path, volume) {
                        Ok(playing) => current = Some(playing),
                        Err(e) => eprintln!("audio: {}: {e}", path.display()),
                    }
                }
            }
        })
        .expect("audio thread");
    tx
}

fn open(path: &PathBuf, volume: f32) -> Result<(OutputStream, Sink), String> {
    let mut stream = OutputStreamBuilder::open_default_stream().map_err(|e| e.to_string())?;
    stream.log_on_drop(false);
    let file = File::open(path).map_err(|e| e.to_string())?;
    let source = Decoder::new(BufReader::new(file)).map_err(|e| e.to_string())?;
    let sink = Sink::connect_new(stream.mixer());
    sink.set_volume(volume.clamp(0.0, 1.0));
    sink.append(source);
    Ok((stream, sink))
}
