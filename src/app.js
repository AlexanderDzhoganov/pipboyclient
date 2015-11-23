import io from 'socket.io-client';
import moment from 'moment';

export class App {

  serverUrl = 'http://localhost:3000';

  connected = false;
  connecting = false;
  connectionError = null;

  lastDBUpdateTime = null;
  db = {};

  player = {
    x: 0.0,
    y: 0.0
  };

  worldMapSize = 640;

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

      this.parseDBContents(db);
      this.redrawWorldMap();
    }.bind(this));
  }

  parseDBContents(db) {
    var worldx = db.Map.World.Player.X;
    var worldy = db.Map.World.Player.Y;

    var extentsMinX = db.Map.World.Extents.NWX;
    var extentsMaxX = db.Map.World.Extents.NEX;

    var extentsMinY = db.Map.World.Extents.SWY;
    var extentsMaxY = db.Map.World.Extents.NWY;

    this.player.x = (worldx - extentsMinX) / (extentsMaxX - extentsMinX);
    this.player.y = (worldy - extentsMinY) / (extentsMaxY - extentsMinY);
  }

  redrawWorldMap() {
    var canvas = document.getElementById('worldmap');
    var ctx = canvas.getContext('2d');

    var img = document.getElementById('worldmap_image');
    ctx.drawImage(img, 0, 0, this.worldMapSize, this.worldMapSize);

    var x = this.player.x * this.worldMapSize;
    var y = this.player.y * this.worldMapSize;

    ctx.fillStyle = "#00FF00";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 16, y);
    ctx.lineTo(x + 8, y + 16);
    ctx.closePath();
    ctx.fill();
  }

}
