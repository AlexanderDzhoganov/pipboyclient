import io from 'socket.io-client';
import moment from 'moment';

export class App {

  serverUrl = 'http://localhost:3000';

  connected = false;
  connecting = false;
  connectionError = null;

  lastDBUpdateTime = null;
  db = {};

  bind() {
    this.connecting = true;

    this.socket = io(this.serverUrl);

    this.socket.on('connect', function() {
      this.connected = true;
      this.connecting = false;
      this.connectionError = null;
    }.bind(this))

    this.socket.on('connect_error', function(err) {
      this.connectionError = err;
      this.connecting = false;
    }.bind(this));

    this.socket.on('db_update', function(db) {
      this.lastDBUpdateTime = moment(Date.now()).format('HH:mm:ss DD/MM/YYYY');
      this.db = db;
    }.bind(this));
  }

}
