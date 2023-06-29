import {RoomApi} from "./RoomApi";
import {RoomManager, Room} from "./Room";

let path = require('path');
let express = require('express');
let cors = require('cors');
let bodyParser = require('body-parser');
let axios = require('axios');

const TOKEN_API = '9e8cfeea52fe45f1ac3a9f1482984e8e';

let app = express();
app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));

let rooms = new RoomManager();
let roomApi = new RoomApi();

app.use('/', roomApi.getRouter(rooms));

app.get('/note', async (req, res) => {
  try {
    const response = await axios.post('https://api.assemblyai.com/v2/realtime/token', 
      { expires_in: 3600 },
      { headers: { authorization: TOKEN_API } });
    const { data } = response;
    res.json(data);
  } catch (error) {
    const {response: {status, data}} = error;
    res.status(status).json(data);
  }
});

app.listen(6767);
console.log('Listening on 6767');