import RecordRTC, { invokeSaveAsDialog } from 'recordrtc';

export class SpeechToTextService {

    recorder;
		isRecording;
		translationMessage: string;

		constructor(){
			this.isRecording = false;
			this.translationMessage = "";
		}

    async startRecording() {
			console.log("startRecording...");
      if (!this.isRecording) {
				this.isRecording = true;
				const response = await fetch('http://localhost:6767/note'); // get temp session token from server.js (backend)
				console.log("Get session token from server...");
				const data = await response.json();

				if(data.error){
					console.log(data.error)
				}

				const { token } = data;

				// establish wss with AssemblyAI (AAI) at 16000 sample rate
				this.socket = await new WebSocket(`wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000&token=${token}`);

				// handle incoming messages to display transcription to the DOM
				const texts = {};
				this.socket.onmessage = (message) => {
					console.log("Message received...");
					let msg = '';
					const res = JSON.parse(message.data);
					texts[res.audio_start] = res.text;
					const keys = Object.keys(texts);
					keys.sort((a, b) => a - b);
					for (const key of keys) {
						if (texts[key]) {
							msg += ` ${texts[key]}`;
						}
					}
					this.translationMessage = msg;
				};

				this.socket.onerror = (event) => {
					console.error(event);
					this.socket.close();
				}
				
				this.socket.onclose = event => {
					console.log(event);
					this.socket = null;
				}

				this.socket.onopen = () => {
					// once socket is open, begin recording
					console.log("Socket is opened, the recording begins...");
					this.translationMessage = "";
					navigator.mediaDevices.getUserMedia({ audio: true })
						.then((stream) => {
							this.recorder = new RecordRTC(stream, {
								type: 'audio',
								mimeType: 'audio/webm;codecs=pcm', // endpoint requires 16bit PCM audio
								recorderType: RecordRTC.StereoAudioRecorder,
								timeSlice: 250, // set 250 ms intervals of data that sends to AAI
								desiredSampRate: 16000,
								numberOfAudioChannels: 1, // real-time requires only one channel
								bufferSize: 4096,
								audioBitsPerSecond: 128000,
								ondataavailable: (blob) => {
									const reader = new FileReader();
									reader.onload = () => {
										const base64data = reader.result;

										// audio data must be sent as a base64 encoded string
										if (this.socket) {
											this.socket.send(JSON.stringify({ audio_data: base64data.split('base64,')[1] }));
										}
									};
									reader.readAsDataURL(blob);
								},
							});

							this.recorder.startRecording();
						})
						.catch((err) => console.error(err));
				};
			}
    }

    async stopRecording() {
			console.log("stopRecording...");
			if (this.isRecording) {
				if (this.socket) {
					console.log("Closing socket...");
					this.socket.send(JSON.stringify({terminate_session: true}));
					this.socket.close();
					this.socket = null;
				}

				if (this.recorder) {
					console.log("Closing recorder...");
					this.recorder.pauseRecording();
					this.recorder = null;
				}

				this.isRecording = false;
				console.log("Recording stopped!!");
			}
    }

    async stopRecordingAndGetText(): Promise<string> {
			console.log("stopRecordingAndGetText...");
			await this.stopRecording();
			console.log("The message is: " + this.translationMessage);
			return this.translationMessage;
		}

}
