import io from 'socket.io-client';
import moment from 'moment';

import $ from 'jquery';
import JSONView from 'yesmeck/jquery-jsonview';

import shader from 'shader';

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
  showLocalMap = false;

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
      this.socket.emit('localmap_update');
    }.bind(this))

    this.socket.on('connect_error', function(err) {
      this.connectionError = err;
      this.connecting = false;
    }.bind(this));

    this.socket.on('db_update', function(db) {
      this.lastDBUpdateTime = moment(Date.now()).format('HH:mm:ss DD/MM/YYYY');
      this._db = db;
    }.bind(this));

    this.socket.on('localmap_update', function(map) {
      this.localMap = map;

      if(this.selectedTab === 'MAP' && this.showLocalMap) {
        this.redrawLocalMap();
      }
    }.bind(this));

    setInterval(function() {
      this.db = this._db;
      this.parseDBContents(this.db);

      if(this.selectedTab === 'MAP') {
        if(!this.showLocalMap) {
          this.redrawWorldMap();
        }
      }
    }.bind(this), 1000);

    setInterval(function() {
      if(this.showLocalMap) {
        this.socket.emit('localmap_update');
      }
    }.bind(this), 1000);
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

  initLocalMap() {
    var canvas = document.getElementById('localmap');
    this.gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if(!this.gl) {
      console.error('no webgl support');
      return;
    }

    var gl = this.gl;

    gl.clearColor(1.0, 0.0, 0.0, 1.0);
    gl.disable(gl.DEPTH_TEST);

    this.localMapTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.localMapTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);

    this.fsQuadVBO = gl.createBuffer();

    var vertices = [
       1.0,  1.0,
      -1.0,  1.0,
      -1.0, -1.0,
      -1.0, -1.0,
       1.0, -1.0,
       1.0,  1.0
    ];

    gl.bindBuffer(gl.ARRAY_BUFFER, this.fsQuadVBO);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    this.localMapShader = new shader(gl, $('#localmap-vertshader').html(), $('#localmap-fragshader').html());
  }

  redrawLocalMap() {
    if(!this.gl) {
      this.initLocalMap();
    }

    if(!this.localMap) {
      return;
    }

    var gl = this.gl;

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.bindTexture(gl.TEXTURE_2D, this.localMapTexture);

    var data = new Uint8Array(this.localMap.pixels);

    if(data.length != (this.localMap.width * this.localMap.height)) {
      console.error('texture size mismatch');
    }

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, this.localMap.width, this.localMap.height,
      0, gl.LUMINANCE, gl.UNSIGNED_BYTE, data);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.fsQuadVBO);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    this.localMapShader.use();
    var canvas = document.getElementById('localmap');
    canvas.width = this.localMap.width;
    canvas.height = this.localMap.height;

    gl.uniform2f(gl.getUniformLocation(this.localMapShader._program, "screenSize"), canvas.width, canvas.height);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    console.error(gl.getError());
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
    if(!this.db.Inventory.stimpakObjectIDIsValid) {
      console.error('db.Inventory.stimpakObjectIDIsValid == false');
      return;
    }

    this.socket.emit('command', 'UseItem', [this.db.Inventory.stimpakObjectID, 0, this.db.Inventory.Version]);
  }

}
