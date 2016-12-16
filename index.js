/* global AFRAME, THREE */
if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available.');
}

var createText = require('three-bmfont-text');
var loadFont = require('load-bmfont');
var SDFShader = require('./lib/shaders/sdf');

require('./extras/text-primitive.js'); // Register experimental text primitive

var DEFAULT_WIDTH = 1; // 1 matches other AFRAME default widths... 5 matches prior bmfont examples etc.

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
      // default to geometry width, or if not present then DEFAULT_WIDTH
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
      type: 'number'
      // default to font's lineHeight value
    },
    fnt: {
      type: 'string',
      default: 'https://cdn.rawgit.com/bryik/aframe-bmfont-text-component/aa0655cf90f646e12c40ab4708ea90b4686cfb45/assets/DejaVu-sdf.fnt'
    },
    fntImage: {
      type: 'string'
      // default to fnt but with .fnt replaced by .png
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
      default: 'center' // center default to match primitives like plane; if 'align', null or undefined, same as align
    },
    wrappixels: {
      type: 'number'
      // if specified, units are bmfont pixels (e.g. DejaVu default is size 32) 
    },
    wrapcount: {
      type: 'number',
      default: 40 // units are 0.6035 * font size e.g. about one default font character (monospace DejaVu size 32) 
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
      var textrenderwidth = data.wrappixels || (data.wrapcount * 0.6035 * font.info.size);

      // Setup texture, should set anisotropy to user maximum...
      texture.needsUpdate = true;
      texture.anisotropy = 16;

      var options = {
        font: font, // the bitmap font definition
        text: data.text, // the string to render
        width: textrenderwidth,
        align: data.align,
        letterSpacing: data.letterSpacing,
        lineHeight: data.lineHeight || font.common.lineHeight,
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

      // compute width, which we may inherit from geometry
      var elgeo = el.getAttribute("geometry");
      var width = data.width || (elgeo && elgeo.width) || DEFAULT_WIDTH;
      var text = new THREE.Mesh(geometry, material);
      var textScale = width / textrenderwidth;
      var height = textScale * geometry.layout.height;

      // update geometry dimensions to match layout, if not specified
      if (elgeo) {
          if (!elgeo.width) { el.setAttribute("geometry", "width", width); }
          el.setAttribute("geometry", "height", height);
      }

      // Rotate so text faces the camera
      text.rotation.y = Math.PI;

      // Scale text down
      text.scale.multiplyScalar(-textScale);

      // Position based on anchor value
      var anchor = data.anchor === 'align' ? data.align : data.anchor || data.align;
      if (anchor.indexOf('left') < 0) {
          text.position.x -= width * (anchor.indexOf('right') >= 0 ? 1 : 0.5);
      }
      // TODO: if height was specified, factor that into anchor
      if (anchor.indexOf('bottom') < 0) {
          text.position.y -= height * (anchor.indexOf('top') >= 0 ? 1 : 0.5);
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
