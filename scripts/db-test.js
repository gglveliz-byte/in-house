const { PrismaClient } = require('@prisma/client')

async function run(){
  const prisma = new PrismaClient()
  try{
    const c = await prisma.store.count()
    console.log('store count', c)
  }catch(e){
    console.error('DB error', e.message)
    process.exit(1)
  }finally{
    await prisma.$disconnect()
  }
}

run()
