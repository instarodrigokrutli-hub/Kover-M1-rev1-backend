'use strict'

const Category = require('../../Models/Category')
const { assertRole } = require('../../Services/Authorization')
const CreateCategory = require('../../Validators/CreateCategory')

class CategoriesController {
  // GET /categories
  async index() {
    return Category.query().where('active', true).orderBy('name', 'asc')
  }

  // POST /categories
  async store(ctx) {
    assertRole(ctx, ['admin'])
    const { request, response, user } = ctx
    const { name } = await request.validate(CreateCategory)
    const category = await Category.create({ name, created_by: user.id, updated_by: user.id })
    return response.status(201).json(category)
  }

  // GET /categories/:id
  async show({ params, response }) {
    const category = await Category.find(params.id)
    if (!category) return response.status(404).json({ message: 'Categoria não encontrada.' })
    return category
  }

  // PUT /categories/:id
  async update(ctx) {
    assertRole(ctx, ['admin'])
    const { params, request, response, user } = ctx
    const { name } = request.only(['name'])
    const category = await Category.find(params.id)
    if (!category) return response.status(404).json({ message: 'Categoria não encontrada.' })
    if (name) category.name = name
    category.updated_by = user.id
    await category.save()
    return category
  }

  // DELETE /categories/:id -> inativa
  async destroy(ctx) {
    assertRole(ctx, ['admin'])
    const { params, response } = ctx
    const category = await Category.find(params.id)
    if (!category) return response.status(404).json({ message: 'Categoria não encontrada.' })
    category.active = false
    await category.save()
    return response.status(204).send()
  }
}

module.exports = CategoriesController
