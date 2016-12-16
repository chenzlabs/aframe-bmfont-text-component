/* global AFRAME */

/* Experimental text primitive.
 * Issues: color not changing, removeAttribute() not working, mixing primitive with regular entities fails
 * Color issue relates to: https://github.com/donmccurdy/aframe-extras/blob/master/src/primitives/a-ocean.js#L44
 */

var extendDeep = AFRAME.utils.extendDeep;
var meshMixin = AFRAME.primitives.getMeshMixin();

AFRAME.registerPrimitive('a-text', extendDeep({}, meshMixin, {
  defaultComponents: {
    'bmfont-text': {anchor: 'align'}
  },
  mappings: {
    text: 'bmfont-text.text',
    width: 'bmfont-text.width',
    aframewidth: 'bmfont-text.aframewidth',
    aframeheight: 'bmfont-text.aframeheight',
    align: 'bmfont-text.align',
    letterspacing: 'bmfont-text.letterSpacing',
    lineheight: 'bmfont-text.lineHeight',
    fnt: 'bmfont-text.fnt',
    fntimage: 'bmfont-text.fntImage',
    mode: 'bmfont-text.mode',
    color: 'bmfont-text.color',
    opacity: 'bmfont-text.opacity',
    anchor: 'bmfont-text.anchor',
    textscale: 'bmfont-text.textscale',
  }
}));
