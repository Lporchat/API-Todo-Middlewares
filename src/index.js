const express = require('express');
const validator = require('validator');


const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

const users = [];

function checksExistsUserAccount(req, res, next) {

  const { username } = req.headers;
  // procurando se tem o user no "banco"
  const userExist = users.find((user) => user.username === username);
  // caso o usuario não tenha sido cadastrado exibir mensagem.
  if(!userExist){
    return res.status(404).json({error: 'Mensagem do erro'});
  }
  // colocando para qualquer um que usar o midwere o usuario e mandando seguir
  req.user = userExist;
  return next();
}

function checksCreateTodosUserAvailability(req, res, next) {

  const { user } = req;
  
  if((user.todos.length < 10 && !user.pro) || user.pro){
      return next();
  }
  return res.status(403).json({error: 'Mensagem do erro'});



}

function checksTodoExists(req, res, next) {
  const { username } = req.headers;
  const { id } = req.params;
  // validando usuario
  const userExist = users.find(user => user.username === username)
  
  if(!userExist){
    return res.status(404).json({error: 'Mensagem do erro'});
  }

  if(!validator.isUUID(id, 4)){
    return res.status(400).json({error: 'Mensagem do erro'});
  }

  const todo = userExist.todos.find(todo => todo.id === id);

  if(!todo){
    return res.status(404).json({error: 'Mensagem do erro'}); 
  }
  //falta de lida nas specs
  req.todo = todo;
  req.user = userExist;

  return next();
}

function findUserById(req, res, next) {
  
  const { id } = req.params;

  const userExist = users.find((user) => user.id === id);
  // caso o usuario não tenha sido cadastrado exibir mensagem.
  if(!userExist){
    return res.status(404).json({error: 'Mensagem do erro'});
  }

  req.user = userExist;
  return next();
}

app.post('/users', (req, res) => {
  const { name, username } = req.body;

  const usernameAlreadyExists = users.some((user) => user.username === username);

  if (usernameAlreadyExists) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  const user = {
    id: uuidv4(),
    name,
    username,
    pro: false,
    todos: []
  };

  users.push(user);

  return res.status(201).json(user);
});

app.get('/users/:id', findUserById, (req, res) => {
  const { user } = req;

  return res.json(user);
});

app.patch('/users/:id/pro', findUserById, (req, res) => {
  const { user } = req;

  if (user.pro) {
    return res.status(400).json({ error: 'Pro plan is already activated.' });
  }

  user.pro = true;

  return res.json(user);
});

app.get('/todos', checksExistsUserAccount, (req, res) => {
  const { user } = req;

  return res.json(user.todos);
});

app.post('/todos', checksExistsUserAccount, checksCreateTodosUserAvailability, (req, res) => {
  const { title, deadline } = req.body;
  const { user } = req;

  const newTodo = {
    id: uuidv4(),
    title,
    deadline: new Date(deadline),
    done: false,
    created_at: new Date()
  };

  user.todos.push(newTodo);

  return res.status(201).json(newTodo);
});

app.put('/todos/:id', checksTodoExists, (req, res) => {
  const { title, deadline } = req.body;
  const { todo } = req;

  todo.title = title;
  todo.deadline = new Date(deadline);

  return res.json(todo);
});

app.patch('/todos/:id/done', checksTodoExists, (req, res) => {
  const { todo } = req;

  todo.done = true;

  return res.json(todo);
});

app.delete('/todos/:id', checksExistsUserAccount, checksTodoExists, (req, res) => {
  const { user, todo } = req;

  const todoIndex = user.todos.indexOf(todo);

  if (todoIndex === -1) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  user.todos.splice(todoIndex, 1);

  return res.status(204).send();
});

module.exports = {
  app,
  users,
  checksExistsUserAccount,
  checksCreateTodosUserAvailability,
  checksTodoExists,
  findUserById
};