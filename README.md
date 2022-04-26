# Signal-ML

This is a fork of signal, which relies on its simple but friendly UI design to experiment with the usage of machine learning-based virtual instruments within DAWs. Currently, many ML based instrument are not as accessible to musicians, as they are in research phase and therefore UI is not a focus for these instruments.

This application seeks to solve this issue through the following systems:

- Delegating rendering to a backend server
- Concurrent rendering through note chunking
- Modular script-based instructions for rendering

In essence, the backend is doing nothing more than running script on a midi file that it has received, and sending an audio wav file back as a respond.

- For users, this process is made an seemless as possible by not blocking workflow and allowing sections of the song to be converted at its own pace.

- For researchers, a modular backend means that all that is needed to set up a server is to host the ![backend server](https://github.com/poohcom1/signal-ml-backend) and a create a "manifest file" for each model, which is a mix of shell script and a config file that tells the backend how to convert a midi file and what kind of parameters the user can control. The configs specified in the file would be intelligently displayed to the user as formatted options.
- See https://github.com/poohcom1/signal-ml-backend for more information on the backend.

This is a WIP, so there are still many features and bugs to be resolved.

### Environment variables

`BACKEND` The url for the backend server

#

![Node.js CI](https://github.com/ryohey/signal/workflows/Node.js%20CI/badge.svg) [![Join the chat at https://gitter.im/signal-midi/community](https://badges.gitter.im/signal-midi/community.svg)](https://gitter.im/signal-midi/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

# Signal

A friendly music sequencer application built with web technology.

## Goals

- Cross-platform
- NOT complicated UI
- MIDI format compatible

## Concepts

Recording and finishing is the role of the DAW, making it an app that can be used quickly at the composition and sketching stages.
The following restrictions are given so that you can concentrate on composing without being distracted by the selection of sound sources and adjustment of effects.

- No high-quality sound
- No Fx
- Make it as lightweight as possible

## Contribution

Any kind of contribution is welcome.
