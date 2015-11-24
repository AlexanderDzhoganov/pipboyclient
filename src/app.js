import io from 'socket.io-client';
import moment from 'moment';

import $ from 'jquery';
import JSONView from 'yesmeck/jquery-jsonview';

export class App {

  serverUrl = 'http://localhost:3000';

  connected = false;
  connecting = false;
  connectionError = null;

  lastDBUpdateTime = null;
  db = null;
  _db = null;

  commands = [
    'UseItem',
    'DropItem',
    'SetFavorite',
    'ToggleComponentFavorite',
    'SortInventory',
    'ToggleQuestActive',
    'SetCustomMapMarker',
    'RemoveCustomMapMarker',
    'CheckFastTravel',
    'FastTravel',
    'MoveLocalMap',
    'ZoomLocalMap',
    'ToggleRadioStation',
    'RequestLocalMapSnapshot',
    'ClearIdle'
  ];

  player = {
    x: 0.0,
    y: 0.0,
    healthPercent: 0,
    health: 0,
    maxHealth: 0
  };

  worldMapSize = 640;

  tabs = ['STAT', 'INV', 'DATA', 'MAP', 'RADIO'];
  selectedTab = 'MAP';

  command = null;
  commandArgs = '';
  commandError = null;

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
      this._db = db;
    }.bind(this));

    setInterval(function() {
      this.db = this._db;
      this.parseDBContents(this.db);

      if(this.selectedTab === 'MAP') {
        this.redrawWorldMap();
      }
    }.bind(this), 500);
  }

  parseDBContents(db) {
    var worldx = db.Map.World.Player.X;
    var worldy = db.Map.World.Player.Y;

    var extentsMinX = db.Map.World.Extents.NWX;
    var extentsMaxX = db.Map.World.Extents.NEX;

    var extentsMinY = db.Map.World.Extents.SWY;
    var extentsMaxY = db.Map.World.Extents.NWY;

    this.player.x = (worldx - extentsMinX) / (extentsMaxX - extentsMinX);
    this.player.y = 1.0 - (worldy - extentsMinY) / (extentsMaxY - extentsMinY);

    this.player.healthPercent = (this.db.PlayerInfo.CurrHP / this.db.PlayerInfo.MaxHP) * 100;
    this.player.health = this.db.PlayerInfo.CurrHP.toFixed(2);
    this.player.maxHealth = this.db.PlayerInfo.MaxHP.toFixed(2);
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

  debugDB() {
    $('#db_json').JSONView(this.db);
    $('#db_json').JSONView('collapse');
  }

  sendCommand() {
    this.commandError = null;
    var args = null;

    try {
      args = JSON.parse(this.commandArgs);
    } catch(err) {
      this.commandError = 'Failed to parse command args JSON';
      return;
    }

    this.socket.emit('command', this.command, args);
    alert('command sent!');
  }

  switchToRadio(radio) {
    if(!radio.inRange || radio.active) {
      return;
    }

    this.socket.emit('command', 'ToggleRadioStation', [radio._index]);
  }

  useStimpak() {
    if(!db.Inventory.stimpakObjectIDIsValid) {
      console.error('db.Inventory.stimpakObjectIDIsValid == false');
      return;
    }

    this.socket.emit('command', 'UseItem', [db.Inventory.stimpakObjectID, 0, db.Inventory.Version]);
  }

}
