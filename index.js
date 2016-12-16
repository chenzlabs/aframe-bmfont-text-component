/* global AFRAME, THREE */
if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available.');
}

var createText = require('three-bmfont-text');
var loadFont = require('load-bmfont');
var SDFShader = require('./lib/shaders/sdf');

require('./extras/text-primitive.js'); // Register experimental text primitive

/**
 * bmfont text component for A-Frame.
 */
AFRAME.registerComponent('bmfont-text', {
  schema: {
    text: {
      type: 'string'
    },
    width: { // use AFRAME units i.e. meters, not arbitrary numbers...
      type: 'number',
      default: 5 // drop legacy width
    },
    height: { // use AFRAME units i.e. meters, not arbitrary numbers...
      type: 'number'
      // no default, will be populated at layout
    },
    align: {
      type: 'string',
      default: 'left'
    },
    letterSpacing: {
      type: 'number',
      default: 0
    },
    lineHeight: {
      type: 'number',
      default: 38
    },
    fnt: {
      type: 'string',
      default: 'https://cdn.rawgit.com/bryik/aframe-bmfont-text-component/aa0655cf90f646e12c40ab4708ea90b4686cfb45/assets/DejaVu-sdf.fnt'
    },
    fntImage: {
      type: 'string',
    },
    mode: {
      type: 'string',
      default: 'normal'
    },
    color: {
      type: 'color',
      default: '#000'
    },
    opacity: {
      type: 'number',
      default: '1.0'
    },
    anchor: {
      type: 'string',
      default: 'left' // for compatibility; if 'align', null or undefined, same as align
    },
    textscale: {
      type: 'number',
      default: 0 // try no default and basing on computed width... default: 0.005
    }
  },

  /**
   * Called when component is attached and when component data changes.
   * Generally modifies the entity based on the data.
   */
  update: function (oldData) {
    // Entity data
    var el = this.el;
    var data = this.data;

    // Use fontLoader utility to load 'fnt' and texture
    fontLoader({
      font: data.fnt,
      image: (data.fntImage && data.fntImage.length) ? data.fntImage : data.fnt.replace('.fnt', '.png')
    }, start);

    function start(font, texture) {
/*
      var aframescale = 200; // legacy because textscale was hardcoded as 0.005
      if (!data.width) { data.width = data.legacywidth / aframescale; }
*/
      var textrenderwidth = 1000; //2300; // gets 60 numbers in default font on same line
//      var width = data.aframewidth ? data.aframewidth * aframescale : data.width;
//      console.log('data.width = ' + data.width + ' aframewidth = ' + data.aframewidth + ' ==> width ' + width);

      // Setup texture, should set anisotropy to user maximum...
      texture.needsUpdate = true;
      texture.anisotropy = 16;

      var options = {
        font: font, // the bitmap font definition
        text: data.text, // the string to render
        width: textrenderwidth,
        align: data.align,
        letterSpacing: data.letterSpacing,
        lineHeight: data.lineHeight,
        mode: data.mode
      };

      // Create text geometry
      var geometry = createText(options);

      // Use './lib/shaders/sdf' to help build a shader material
      var material = new THREE.RawShaderMaterial(SDFShader({
        map: texture,
        side: THREE.DoubleSide,
        transparent: true,
        color: data.color,
        opacity: data.opacity
      }));

      var textScale = data.width / textrenderwidth;
      console.log('computed textScale ' + textScale);

      var text = new THREE.Mesh(geometry, material);

      // update to match text width and Y extent from layout
      // is this even necessary? data.width = geometry.layout.width;
      data.height = textScale * (geometry.layout.height + geometry.layout.descender);
      console.log('layout object3D geometry ' + geometry.layout.width + 'x' + (geometry.layout.height + geometry.layout.descender));
      console.log('text object3D geometry ' + data.width + 'x' + data.height);
/*
      // what is the right incantation?
      if (el.components.geometry) {
          el.components.geometry.data.height = data.height;
          el.components.geometry.data.width = data.width;
      }
*/

      // Rotate so text faces the camera
      text.rotation.y = Math.PI;

      // Scale text down
      text.scale.multiplyScalar(-textScale);

      // Position based on anchor value
      var anchor = data.anchor === 'align' ? data.align : data.anchor || data.align;
      if (anchor.indexOf('left') < 0) {
          text.position.x -= data.width * (anchor.indexOf('right') >= 0 ? 1 : 0.5);
      }
      if (anchor.indexOf('bottom') < 0) {
          text.position.y -= data.height * (anchor.indexOf('top') >= 0 ? 1 : 0.5);
      }

      // Register text mesh under entity's object3DMap
      el.setObject3D('bmfont-text', text);
    }
  },

  /**
   * Called when a component is removed (e.g., via removeAttribute).
   * Generally undoes all modifications to the entity.
   */
  remove: function () {
    this.el.removeObject3D('bmfont-text');
  }
});

/**
 * A utility to load a font with bmfont-load
 * and a texture with Three.TextureLoader()
 */
function fontLoader (opt, cb) {
  loadFont(opt.font, function (err, font) {
    if (err) {
      throw err;
    }

    var textureLoader = new THREE.TextureLoader();
    textureLoader.load(opt.image, function (texture) {
      cb(font, texture);
    });
  });
}
