import test from 'node:test'
import assert from 'node:assert/strict'
import { toMouldFormData } from '../mouldFormData.js'

test('uploads the image file with mould fields, excluding preview URLs and unrelated material images', () => {
  const picture = new File(['image'], 'mould.png', { type: 'image/png' })
  const form = toMouldFormData({ mouldNumber: 'M001', manufacturerName: '厂商A', picture,
    pictureUrl: 'created', drawingReference: '/profile/material.png' })
  assert.equal(form.get('mouldNumber'), 'M001')
  assert.equal(form.get('manufacturerName'), '厂商A')
  assert.equal(form.get('picture').name, 'mould.png')
  assert.equal(form.get('picture').size, picture.size)
  assert.equal(form.has('pictureUrl'), false)
  assert.equal(form.has('drawingReference'), false)
})

test('an edit without a new file preserves the image and serializes the unassigned house', () => {
  const form = toMouldFormData({ id: 12, mouldHouseId: -1, pictureUrl: '/profile/upload/old.png',
    picture: null, deletePicture: false, trialDate: '', status: '已外发' })
  assert.equal(form.has('picture'), false)
  assert.equal(form.has('pictureUrl'), false)
  assert.equal(form.has('trialDate'), false)
  assert.equal(form.get('deletePicture'), 'false')
  assert.equal(form.get('mouldHouseId'), '-1')
})

test('removing an existing image sends an explicit deletion flag', () => {
  const form = toMouldFormData({ id: 12, deletePicture: true, picture: null })
  assert.equal(form.get('deletePicture'), 'true')
  assert.equal(form.has('picture'), false)
})
