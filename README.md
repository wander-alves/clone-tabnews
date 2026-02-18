# Projeto Curso.Dev - Clone TabNews

## Objetivo

Nesse projeto sensacional proposto pelo Filipe Deschamps (parece, mas não é o Teló) no [Curso.Dev](https://curso.dev/), vamos recriar um projeto muito massa, chamado [TabNews](https://tabnews.com.br), que partiu do princípio de criar um lugar massa para podermos trocar conhecimento na comunidade brasileira, o que é algo muito, mas relamente muito massa. Ele é um projeto razoavelmente complexo e vai ser desafiador.

Então nesse primeiro momento, estou apenas no repositório inicial, onde apenas criamos uma estrutura muito básica com o Next.js para nos aclimatar com o Git, GitHub e processo de deploy de uma aplicação na [Vercel](https://vercel.com).

## Tecnologias

Falando mais detalhadamente sobre as tecnologias que iremos utilizar no projeto, temos uma aplicação mais monolítica, mas que poderá ser expandida tranquilamente conforme a necessidade do projeto, o que imagino que irá ocorrer em um momento mais avançado.

O que utilizamos para construir o projeto até o momento:

- JavaScript
- Jest
- Next.js e React.js
- Git
- GitHub

## Endpoints

*Listar migrations pendentes:*
`[GET] /api/v1/migrations`

*Executar migrations pendentes:*
`[POST] /api/v1/migrations`

*Criação de um usuários:*
`[POST] /api/v1/users`

*Busca de um usuário específico:*
`[GET] /api/v1/users/[username]`

## Estrutura/Modelagem das tabelas 

**Users**
Referências: [Ruby On Rails: Migrations Guide](https://guides.rubyonrails.org/active_record_migrations.html)

- id: UUID V4 gerado pelo banco
- username: Nome de usuário com limite de 30 caracteres.
  - [Motivação da decisão]()
- email: E-mail de usuário com limite de 256 caracteres.
  - [Motivação da decisão](https://stackoverflow.com/questions/1199190/what-is-the-optimal-length-for-an-email-address-in-a-database/1199238#1199238)
- password: E-mail de usuário com limite de 256 caracteres.
  - [Motivação da decisão](https://security.stackexchange.com/questions/39849/does-bcrypt-have-a-maximum-password-length/39851#39851)
- created_at: Data de criação de um usuário seguindo o padrão Timestamp UTC.
  - [Motivação da decisão](https://justatheory.com/2012/04/postgres-use-timestamptz/)
- updated_at: Data de atualização de um usuário seguindo o padrão Timestamp UTC.
  - [Motivação da decisão](https://justatheory.com/2012/04/postgres-use-timestamptz/)