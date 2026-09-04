'use strict';
(function(){
  const clone=value=>JSON.parse(JSON.stringify(value));
  const vocab=(word,pos,def,example)=>({word,pos,def,example});
  const choice=(prompt,options,answer,explain)=>({prompt,options,answer,explain,type:'choice'});
  const lesson=(id,title,subtitle,vocabulary,definitions,notes,grammar,reading,manual)=>({id,title,subtitle,vocab:vocabulary,definitions,notes,grammar,reading,manual,curriculum2027:true,generatedQuestions:true,useGeneratedGuide:true});
  const languageFocus=(title,rule,forms,tip)=>({title,rule,forms,tip});
  const reading=(title,main,points)=>({title,main,points});
  const definition=(term,def)=>({term,def});

  function replaceLesson(module,index,next){
    module.lessons[index]=next;
  }

  function renameLesson(module,index,title,subtitle){
    Object.assign(module.lessons[index],{title,subtitle,curriculum2027:true});
  }

  function apply(book){
    const byId=Object.fromEntries(book.map(module=>[module.id,module]));
    const u1=byId.u1,u2=byId.u2,u3=byId.u3,u4=byId.u5,u5=byId.u6;

    Object.assign(u1,{number:1,title:'What Can I Do?',theme:'I Discover Myself',description:'Explore our amazing bodies and senses, use the present simple, read a classic story, and build a healthy summer-camp project.'});
    renameLesson(u1,0,'Our Amazing Bodies','Body systems, organs, and how they work together');
    renameLesson(u1,1,'Our Senses','Sight, hearing, smell, taste, touch, and Braille');
    renameLesson(u1,2,'Language: Present Simple','Regular actions, routines, choices, and irregular verbs');
    replaceLesson(u1,3,lesson('u1l4','Literature Corner: Alice in Wonderland','A strange afternoon in Wonderland',[
      vocab('white rabbit','noun','A rabbit with white fur.','Alice saw a worried white rabbit.'),
      vocab('worried','adjective','Feeling unhappy because something may be wrong.','The white rabbit looked worried.'),
      vocab('strange','adjective','Unusual or difficult to understand.','Wonderland was a strange place.'),
      vocab('bottle','noun','A container used for liquids.','Alice found a small bottle.'),
      vocab('liquid','noun','A substance that flows and is not solid.','Alice drank the liquid in the bottle.'),
      vocab('confused','adjective','Unable to understand what is happening.','Alice felt confused when her size changed.'),
      vocab('delicious','adjective','Having a very pleasant taste.','The cake was delicious.'),
      vocab('calm','adjective','Peaceful and able to think clearly.','Alice stayed calm at the end.')
    ],[definition('character','A person or animal in a story.'),definition('event','Something that happens in a story.')],[
      'The story begins beside a river on a sunny afternoon.','Alice follows the white rabbit because she is curious.','The words Drink me and Eat me lead to two surprising changes.','Sequence words help us retell events in the correct order.'
    ],languageFocus('Past Simple in Stories','Use the past simple to retell finished story events.', ['Alice saw a rabbit.','She drank the liquid.','She ate the cake.'], 'Many common story verbs are irregular: see → saw, drink → drank, eat → ate.'),reading('Alice in Wonderland','Alice follows a worried white rabbit into Wonderland, where a drink makes her smaller and a cake makes her taller.',[
      'Alice was sitting quietly beside a river.','She followed a white rabbit into Wonderland.','She drank from a bottle and became smaller.','She ate a cake and became taller.','Although she was worried and confused, she breathed slowly and stayed calm.'
    ]),[
      choice('Who did Alice follow?',['a white rabbit','a black panther','a prince','a scientist'],0,'Alice followed the white rabbit.'),
      choice('What happened after Alice drank the liquid?',['She became smaller.','She went home.','She became taller.','She fell asleep.'],0,'The liquid made Alice smaller.'),
      choice('What happened after Alice ate the cake?',['She became taller.','She became smaller.','She found a ship.','She met Baloo.'],0,'The cake made Alice taller.'),
      choice('How did Alice feel at the end?',['calm','angry','bored','proud'],0,'Alice was worried and confused, but she stayed calm.')
    ]));
    Object.assign(u1.lessons[3],{
      literatureCorner:true,
      storyEvents:[
        {title:'A worried white rabbit',text:'One sunny afternoon, Alice was sitting quietly beside a river. Suddenly, she saw a worried white rabbit hurry past and say, “I’m late!”'},
        {title:'Following him to Wonderland',text:'Alice followed the rabbit and arrived in a strange place called Wonderland, where everything looked unusual.'},
        {title:'The bottle marked “Drink me”',text:'Alice found a small bottle, read the words “Drink me”, and drank the liquid. She became smaller and smaller.'},
        {title:'The cake marked “Eat me”',text:'Alice then found a small delicious cake. After she ate it, she suddenly became taller and taller.'},
        {title:'Staying calm',text:'Alice felt worried and confused. She ran, breathed slowly, reminded herself to be careful, and finally stayed calm.'}
      ],
      simpleSummary:'Alice follows a worried white rabbit into Wonderland. A drink makes her smaller and a cake makes her taller. Although the strange changes confuse her, Alice breathes slowly and stays calm.',
      storyMessage:'When something feels strange or difficult, slow down, think carefully, and stay calm.'
    });
    renameLesson(u1,4,'Writing: Paragraphs','Topic sentences, supporting details, and conclusions');
    renameLesson(u1,5,'Project: Healthy Summer Camp','Plan and present a balanced camp programme');

    Object.assign(u2,{number:2,title:'Plants and Animals',theme:'I Discover Myself',description:'Classify vertebrates, compare animals, explore colour in art and nature, read a jungle story, and design a micro-habitat.'});
    renameLesson(u2,0,'Vertebrates','The five groups of animals with backbones');
    renameLesson(u2,1,'Language: Comparatives and Superlatives','Compare animal size, speed, and ability');
    const art=clone(u2.lessons[3]);
    Object.assign(art,{id:'u2l3',title:'CLIL: Art',subtitle:'Primary colours, secondary colours, shades, and the colour wheel',curriculum2027:true,generatedQuestions:true,useGeneratedGuide:true});
    replaceLesson(u2,2,art);
    replaceLesson(u2,3,lesson('u2l4','Literature Corner: Learning from the Jungle','Every animal is special',[
      vocab('jungle','noun','A thick tropical forest with many plants and animals.','Mowgli lived in the jungle.'),
      vocab('panther','noun','A large wild cat with dark fur.','Bagheera was a black panther.'),
      vocab('dragonfly','noun','An insect with a long body and two pairs of wings.','A green dragonfly flew over the river.'),
      vocab('snail','noun','A small animal with a shell that moves slowly.','The snail moved along the path.'),
      vocab('habitat','noun','The natural home of a plant or animal.','Animals live in different habitats.'),
      vocab('skill','noun','An ability to do something well.','Different animals have different skills.'),
      vocab('important','adjective','Having great value or meaning.','Every animal is important.'),
      vocab('climb','verb','To move upward using hands, feet, or claws.','Two monkeys climbed up a tree.')
    ],[definition('comparison','Looking at how two or more things are similar or different.'),definition('message','The important idea a story teaches.')],[
      'Baloo is a bear and Bagheera is a black panther.','The dragonfly flies faster than the small blue bird.','The snail is slower than the other animals.','Animals may have different habitats and skills, but they are all important.'
    ],languageFocus('Comparatives in a Story','Use comparative adjectives and adverbs to compare two animals.', ['The dragonfly flies faster than the bird.','The snail is slower than the monkeys.','The monkeys climb better than the snail.'], 'Use than after many comparative forms.'),reading('Learning from the Jungle','Mowgli walks through the jungle with Baloo and Bagheera and learns that every animal has its own useful skill.',[
      'Mowgli lives in the jungle with animal friends.','The friends stop near a river.','A dragonfly and a bird fly over the water.','A snail moves on the path while two monkeys climb a tree.','Baloo explains that slow and fast animals are all important.'
    ]),[
      choice('Who are Mowgli’s two best friends?',['Baloo and Bagheera','Alice and the rabbit','Axel and Hans','Heba and Amr'],0,'Baloo the bear and Bagheera the panther are his friends.'),
      choice('Where did the friends stop?',['near a river','inside a school','on a ship','near a factory'],0,'They stopped near a river.'),
      choice('Which animal moved the slowest?',['the snail','the dragonfly','the bird','the panther'],0,'The snail was slower than the others.'),
      choice('What is the story’s message?',['Every animal is important.','Only fast animals matter.','All animals have the same skill.','Big animals are always best.'],0,'Different animals have different skills and all are important.')
    ]));
    Object.assign(u2.lessons[3],{
      literatureCorner:true,
      storyEvents:[
        {title:'Mowgli and his best friends',text:'Mowgli lived in the jungle and had many animal friends. His two best friends were Baloo the bear and Bagheera the black panther.'},
        {title:'A stop near the river',text:'One morning, the three friends walked through the jungle and stopped near a river to look carefully at the animals around them.'},
        {title:'The dragonfly and the bird',text:'A beautiful green dragonfly and a small blue bird flew together over the river. The dragonfly flew faster than the bird.'},
        {title:'The snail and the monkeys',text:'Later, they saw a small snail on the path and two monkeys climbing a tree. The snail was slower, but the monkeys were good at climbing.'},
        {title:'Baloo’s important lesson',text:'Baloo explained that animals live in different habitats and have different skills. Slow or fast, every animal is important.'}
      ],
      simpleSummary:'Mowgli explores the jungle with Baloo and Bagheera. They compare a dragonfly, a bird, a snail, and two monkeys. Mowgli learns that animals have different habitats and skills, but they are all important.',
      storyMessage:'Do not judge an animal by one skill. Every living thing has value and a special role.'
    });
    renameLesson(u2,4,'Writing: Linking Words and Phrases','Connect and contrast ideas clearly');
    renameLesson(u2,5,'Project: Micro-habitat','Design, label, and describe a small habitat');

    Object.assign(u3,{number:3,title:'My World',theme:'I Discover Myself',description:'Explore communities, Ancient Egypt, folk music, kindness, descriptive writing, and a tourist-information project.'});
    renameLesson(u3,0,'My Community','People, places, citizenship, and belonging');
    renameLesson(u3,1,'Language: Past Simple','Ancient Egyptian history and finished past actions');
    const music=clone(u3.lessons[3]);
    Object.assign(music,{id:'u3l3',title:'CLIL: Music',subtitle:'Traditional Egyptian folk music and instruments',curriculum2027:true,generatedQuestions:true,useGeneratedGuide:true});
    replaceLesson(u3,2,music);
    replaceLesson(u3,3,lesson('u3l4','Literature Corner: The Kind Prince and the Bird','Small acts of kindness can make a big difference',[
      vocab('statue','noun','A figure made from stone, metal, or another material.','The Happy Prince became a gold statue.'),
      vocab('column','noun','A tall upright support or structure.','The statue stood on a tall column.'),
      vocab('comfortably','adverb','In a pleasant and easy way.','Some people lived comfortably.'),
      vocab('poor','adjective','Having very little money or food.','The bird saw poor families in the city.'),
      vocab('journey','noun','Travel from one place to another.','The bird rested after a long journey.'),
      vocab('kindness','noun','The quality of being caring and helpful.','The prince showed kindness to the people.'),
      vocab('gold','noun','A valuable yellow metal.','The bird carried gold from the statue.'),
      vocab('difference','noun','A change or effect caused by an action.','The kind act made a difference.')
    ],[definition('character motive','The reason a character chooses to act.'),definition('moral','The lesson about life or behaviour in a story.')],[
      'The Happy Prince was once a real prince who loved his city.','As a statue, he could see that some people needed help.','A tired bird agreed to stay and help him.','The bird carried the prince’s gold to poor families.'
    ],languageFocus('Past Simple Story Events','Use the past simple to describe completed actions in sequence.', ['The bird arrived in the city.','The prince felt sad.','The bird took gold to the people.'], 'Use did in past questions and the base verb after it.'),reading('The Kind Prince and the Bird','A gold statue asks a tired bird to help poor families, and their kindness improves life in the city.',[
      'The Happy Prince stood above the city on a tall column.','He saw that life was not comfortable for everyone.','A small bird arrived after a long journey.','The prince asked the bird to share his gold.','The bird helped families buy food and clothes.'
    ]),[
      choice('Where did the Happy Prince stand?',['on a tall column','inside a cave','beside a river','on a train'],0,'The statue stood on a tall column.'),
      choice('Why did the prince feel sad?',['Some people were poor and needed help.','The bird was noisy.','The city had no music.','He lost a race.'],0,'He could see people who needed help.'),
      choice('What did the bird carry to the people?',['gold','coal','books','water'],0,'The bird took gold from the statue.'),
      choice('What do we learn?',['Be kind and help others.','Never work in a team.','Only rich people matter.','Travel is always easy.'],0,'Small acts of kindness can make a big difference.')
    ]));
    Object.assign(u3.lessons[3],{
      literatureCorner:true,
      storyEvents:[
        {title:'The prince above the city',text:'The Happy Prince was once a real prince. He later became a beautiful gold statue standing on a tall column high above the city.'},
        {title:'Seeing people who needed help',text:'From above, the prince saw that some people lived comfortably while other people were poor and needed food and warm clothes.'},
        {title:'A tired bird arrives',text:'A small bird arrived after a long journey and rested on the statue. The prince asked the bird to stay and help, and the bird agreed.'},
        {title:'Flying across the city',text:'The bird flew through the streets and saw families without food and children who were cold.'},
        {title:'Sharing the prince’s gold',text:'The prince asked the bird to take his gold to the poor people. They bought food and clothes, and this act of kindness changed the city.'}
      ],
      simpleSummary:'A golden statue sees poor families in his city and asks a tired bird for help. The bird carries the prince’s gold to people who need food and clothes. Their small acts of kindness make a big difference.',
      storyMessage:'Be kind. A small helpful action can improve another person’s life.'
    });
    renameLesson(u3,4,'Writing: Using Topic Sentences','Create a focused description with supporting details');
    renameLesson(u3,5,'Project: Tourist Information Guide','Present a governorate to visitors');

    Object.assign(u4,{number:4,title:'Resources in Our World',theme:'Myself and Others',description:'Investigate natural resources and renewable energy, practise possessive adjectives, build teamwork skills, and read an underground adventure.'});
    renameLesson(u4,0,'Natural Resources','Renewable and non-renewable materials from nature');
    replaceLesson(u4,1,lesson('u5l2','Renewable Energy','Solar, wind, wave, and tidal power',[
      vocab('renewable resource','noun','A natural resource that is replaced in a short time.','Sunlight is a renewable resource.'),
      vocab('non-renewable resource','noun','A resource that takes a very long time to form.','Coal is a non-renewable resource.'),
      vocab('solar power','noun','Energy produced from sunlight.','Solar panels turn sunlight into electricity.'),
      vocab('wind power','noun','Energy produced by moving air.','Wind turbines produce wind power.'),
      vocab('wave power','noun','Energy produced by the movement of sea waves.','Wave power uses moving water.'),
      vocab('tidal power','noun','Energy produced by the rise and fall of sea levels.','Tidal power depends on the tides.'),
      vocab('fossil fuel','noun','Coal, oil, or gas formed over millions of years.','Burning fossil fuels adds gases to the air.'),
      vocab('global warming','noun','The long-term rise in Earth’s average temperature.','Using clean energy can help reduce global warming.')
    ],[definition('energy source','Something that provides usable power.'),definition('electricity','A form of energy used to power lights and machines.')],[
      'Renewable resources can be replaced naturally in a short time.','Non-renewable resources can run out because they form very slowly.','Solar and wind power do not burn fossil fuels while producing electricity.','Egypt has strong sunlight and wind resources for clean-energy projects.'
    ],languageFocus('Explaining Cause and Effect','Use because to give a reason and so to give a result.', ['Solar power is renewable because sunlight returns.','Fossil fuels are limited, so we should not waste them.'], 'A reason follows because; a result follows so.'),reading('Choosing Cleaner Energy','People compare energy sources by how they are produced, whether they can run out, and how they affect the environment.',[
      'Fossil fuels store energy but take millions of years to form.','Burning fossil fuels contributes to global warming.','Solar panels use sunlight.','Wind turbines use moving air.','Wave and tidal systems use the movement of water.'
    ]),[
      choice('Which source is renewable?',['sunlight','coal','petroleum','natural gas'],0,'Sunlight is replaced naturally.'),
      choice('Which device uses moving air?',['wind turbine','solar panel','battery only','oil well'],0,'A wind turbine captures wind energy.'),
      choice('Why are fossil fuels non-renewable?',['They take millions of years to form.','They return every morning.','They are made by waves.','They use no resources.'],0,'They form extremely slowly.'),
      choice('Which choice can reduce pollution?',['using more renewable energy','burning more coal','wasting electricity','cutting every tree'],0,'Renewable energy can reduce fossil-fuel pollution.')
    ]));
    const possessives=clone(u4.lessons[3]);
    Object.assign(possessives,{title:'Language: Possessive Adjectives',subtitle:'His, her, and their in clear sentences',curriculum2027:true});
    const teamwork=clone(u4.lessons[4]);
    Object.assign(teamwork,{title:'Teamwork',subtitle:'Communicate, collaborate, take responsibility, and solve problems',curriculum2027:true});
    const earth=lesson('u5l3','Literature Corner: Journey to a New Earth','An underground adventure inspired by Jules Verne',[
      vocab('scientist','noun','A person who studies the natural world.','Professor Lidenbrock was a scientist.'),
      vocab('ancient','adjective','Belonging to a very long time ago.','He found a message in an ancient book.'),
      vocab('nephew','noun','The son of someone’s brother or sister.','Axel was the professor’s nephew.'),
      vocab('guide','noun','A person who shows others the way.','Hans was their guide in Iceland.'),
      vocab('volcano','noun','A mountain that can release hot gas, ash, or rock.','The men climbed down through a volcano.'),
      vocab('underground','adverb','Below the surface of the ground.','They found a huge cave underground.'),
      vocab('raft','noun','A flat floating structure used as a simple boat.','They crossed the underground sea on a raft.'),
      vocab('surface','noun','The outside or top layer of something.','They finally returned to the surface.')
    ],[definition('natural resource','A useful material or energy source that comes from nature.'),definition('mineral','A natural solid substance found in rocks and soil.')],[
      'Professor Lidenbrock finds a message describing a route to the centre of Earth.','He travels to Iceland with Axel and meets a guide named Hans.','The three men cross tunnels, caves, and an underground sea.','Hot air and gas push them out through a volcano in Italy.'
    ],languageFocus('Past Simple Adventure Sequence','Use the past simple and sequence words to retell the journey.', ['First, they travelled to Iceland.','Next, they entered the volcano.','Finally, they reached the surface.'], 'Use first, next, after that, then, and finally to make the sequence clear.'),reading('Journey to a New Earth','Professor Lidenbrock, Axel, and Hans travel deep underground, find a strange world, and escape through a volcano.',[
      'A message in an ancient book starts the journey.','The men travel to Iceland and enter a volcano.','They discover caves, minerals, animals, and an underground sea.','They build a wooden raft and cross the water.','Hot gas pushes them to the surface in Italy.'
    ]),[
      choice('Who was Axel?',['the professor’s nephew','the guide','the bird','the ship captain'],0,'Axel was Professor Lidenbrock’s nephew.'),
      choice('Where did the journey begin?',['Iceland','Italy','Egypt','France'],0,'They travelled to Iceland to begin the underground journey.'),
      choice('What did they build to cross the water?',['a raft','a train','a bridge','a plane'],0,'They built a wooden raft.'),
      choice('Where did they reach the surface?',['Italy','Iceland','China','Kenya'],0,'They came out through a volcano in Italy.')
    ]);
    Object.assign(earth,{
      literatureCorner:true,
      storyEvents:[
        {title:'A message in an ancient book',text:'Professor Lidenbrock, a scientist who loved rocks and ancient books, found a message that described a way to travel to the centre of Earth.'},
        {title:'The journey begins in Iceland',text:'The professor travelled to Iceland with his nephew Axel. There they met Hans, an experienced guide, and found a volcano.'},
        {title:'Down through tunnels and caves',text:'The three men climbed down narrow tunnels and moved through dark caves with black soil. They were sometimes afraid, but they continued.'},
        {title:'The underground sea',text:'Deep underground, they discovered a huge cave, strange animals, rocks, minerals, and an underground sea. They built a small wooden raft and crossed the water.'},
        {title:'Back to the surface',text:'After many difficult days, they followed a path where the air became very hot. Volcanic gas pushed them upward, and they reached the surface safely in Italy.'}
      ],
      simpleSummary:'Professor Lidenbrock, Axel, and Hans enter a volcano in Iceland and travel through tunnels to an underground sea. They cross the water on a raft and discover strange animals and minerals. Hot volcanic gas finally pushes them back to the surface in Italy.',
      storyMessage:'Curiosity, courage, and teamwork help people continue through difficult journeys.'
    });
    const project4=clone(u4.lessons[5]);
    Object.assign(project4,{title:'Project: Eco-friendly Transportation',subtitle:'Design transport powered by renewable energy',curriculum2027:true});
    u4.lessons=[u4.lessons[0],u4.lessons[1],possessives,teamwork,earth,project4];

    Object.assign(u5,{number:5,title:"Let's Work",theme:'Myself and Others',description:'Explore transportation, future predictions, technology careers, safe digital habits, paragraph writing, and a simple business plan.'});
    renameLesson(u5,0,'Transportation','Road, rail, water, and air travel');
    renameLesson(u5,1,'Language: Predictions with Will','Future statements, negatives, questions, and punctuation');
    renameLesson(u5,2,'Tech Jobs of the Future','Robotics, user experience, virtual reality, and safe searching');
    renameLesson(u5,3,'CLIL: ICT','Strong passwords, passphrases, and digital safety');
    renameLesson(u5,4,'Writing: Structuring a Paragraph','Plan, order, draft, and improve a focused paragraph');
    renameLesson(u5,5,'Project: My Business Plan','Create and present a useful product or service');

    const review1=byId.r1,coral=byId.coral,review2=byId.r2,story=byId.story;
    Object.assign(review2,{title:'Theme 2 Review',unlockAfter:'u6',description:'A focused review of natural resources, renewable energy, teamwork, transportation, technology, digital safety, and writing from Units 4-5.'});
    replaceLesson(review2,0,lesson('r2l1','Theme 2 Review: Units 4–5','Resources, teamwork, transportation, technology, and future plans',[
      vocab('natural resource','noun','A useful material or source of energy that comes from nature.','Water is an important natural resource.'),
      vocab('renewable','adjective','Able to be replaced naturally in a short time.','Sunlight is a renewable source of energy.'),
      vocab('fossil fuel','noun','Coal, oil, or gas formed over millions of years.','Burning fossil fuels can pollute the air.'),
      vocab('teamwork','noun','People working together to reach the same goal.','Good teamwork helped the group finish its project.'),
      vocab('transportation','noun','Ways of moving people or goods from one place to another.','Trains are a form of land transportation.'),
      vocab('prediction','noun','A statement about what someone thinks will happen.','My prediction is that robots will do more jobs.'),
      vocab('passphrase','noun','A long group of words used to protect an account.','A strong passphrase is easier to remember and harder to guess.'),
      vocab('business plan','noun','A simple plan that explains a product, customers, costs, and goals.','The team presented its business plan to the class.')
    ],[
      definition('possessive adjective','A word such as my, your, his, her, our, or their that shows who owns something.'),
      definition('paragraph structure','A topic sentence followed by supporting details and a concluding sentence.')
    ],[
      'Natural resources come from nature and can be renewable or non-renewable.',
      'Team members communicate clearly, share responsibility, and solve problems together.',
      'Transportation can move people and goods by road, rail, water, or air.',
      'Use will plus the base verb to make a prediction about the future.',
      'Strong passwords and passphrases help protect personal information online.'
    ],languageFocus('Language Review','Use possessive adjectives to show ownership and will to make future predictions.',[
      'This is her solar-powered car.',
      'They will design a safer train.',
      'Will robots help people in the future?'
    ],'A possessive adjective comes before a noun. After will, use the base form of the verb.'),reading('Theme 2 Learning Journey','Units 4 and 5 connect responsible use of resources with teamwork, transportation, technology, safe digital habits, and future planning.',[
      'People can protect natural resources by reducing waste and choosing cleaner energy.',
      'A successful team communicates, shares tasks, and respects every member.',
      'Different forms of transportation serve different journeys and needs.',
      'Future jobs may use robotics, virtual reality, design, and problem-solving skills.',
      'A clear paragraph and a practical business plan organise ideas for the reader.'
    ]),[
      choice('Which resource is renewable?',['sunlight','coal','oil','natural gas'],0,'Sunlight is naturally replaced every day.'),
      choice('Which sentence uses a possessive adjective correctly?',['This is their project.','This project is they.','Their are a project.','They project is ready.'],0,'Their comes before the noun project.'),
      choice('Which action shows good teamwork?',['sharing tasks fairly','ignoring other ideas','doing no work','hiding information'],0,'Good teams share tasks and communicate.'),
      choice('Which sentence is a future prediction?',['Robots will help in hospitals.','Robots helped yesterday.','Robots help every day.','Help the robot now.'],0,'Will plus the base verb makes a future prediction.')
    ]));
    Object.assign(story,{unlockAfter:'u6'});
    book.splice(0,book.length,u1,u2,u3,review1,coral,u4,u5,review2,story);
  }

  function normalizeSections(questions){
    const order=['choice','fill','correction','sequence','match','categorize','writing'];
    const groups=order.map(type=>questions.filter(q=>(q.sectionType||q.type||'choice')===type)).filter(group=>group.length);
    let absolute=0;
    return groups.flatMap((group,sectionIndex)=>{
      const start=absolute,end=start+group.length-1;
      absolute=end+1;
      return group.map((question,index)=>({
        ...question,
        sectionType:question.sectionType||question.type||'choice',
        sectionTitle:question.sectionTitle||({choice:'Choose',fill:'Complete',correction:'Correct',sequence:'Reorder',match:'Match',categorize:'Sort',writing:'Write'}[question.type]||'Choose'),
        sectionInstruction:question.sectionInstruction||'Complete the activity.',
        sectionIndex,indexInSection:index,sectionTotal:group.length,
        sectionStartIndex:start,sectionEndIndex:end
      }));
    });
  }

  function selectThirty(all){
    const targets={choice:10,fill:6,correction:4,sequence:4,match:3,categorize:2,writing:1};
    const selected=[];
    const used=new Set();
    Object.entries(targets).forEach(([type,count])=>{
      all.filter(q=>(q.sectionType||q.type||'choice')===type).slice(0,count).forEach(q=>{selected.push(q);used.add(q.id)});
    });
    all.forEach(q=>{if(selected.length<30&&!used.has(q.id)){selected.push(q);used.add(q.id)}});
    return normalizeSections(selected.slice(0,30));
  }

  function generatedQuestions(item){
    const words=item.vocab||[];
    const output=[];
    const distractors=index=>[1,2,3].map(step=>words[(index+step)%words.length].word);
    words.slice(0,8).forEach((entry,index)=>{
      const prompt=entry.example.replace(new RegExp(entry.word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i'),'_____');
      const options=[entry.word,...distractors(index)].slice(0,4);
      output.push({id:`${item.id}-27-choice-${index+1}`,type:'choice',sectionType:'choice',prompt,displayPrompt:prompt,options,answer:0,explain:entry.example});
    });
    (item.manual||[]).slice(0,4).forEach((question,index)=>output.push({...question,id:`${item.id}-27-manual-${index+1}`,sectionType:'choice'}));
    words.slice(0,6).forEach((entry,index)=>{
      const prompt=entry.example.replace(new RegExp(entry.word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i'),'_____');
      output.push({id:`${item.id}-27-fill-${index+1}`,type:'fill',sectionType:'fill',prompt,displayPrompt:prompt,answer:[entry.word],acceptedAnswers:[entry.word],options:[entry.word,...distractors(index)],explain:entry.example});
    });
    const correctionPairs={is:'are',are:'is',was:'were',were:'was',has:'have',have:'has',saw:'see',drank:'drink',ate:'eat',felt:'feel',stood:'stand',asked:'ask',travelled:'travel',entered:'enter',reached:'reach',carried:'carry',lives:'live',flies:'fly',moves:'move',uses:'use',helps:'help',returns:'return',depends:'depend'};
    (item.grammar.forms||[]).slice(0,3).forEach((sentence,index)=>{
      const tokens=sentence.match(/[A-Za-z]+/g)||[];
      let correctWord=tokens.find(token=>correctionPairs[token.toLowerCase()]);
      if(!correctWord&&/\bwill\s+([A-Za-z]+)/i.test(sentence))correctWord=sentence.match(/\bwill\s+([A-Za-z]+)/i)[1];
      if(!correctWord)correctWord=tokens[Math.min(1,Math.max(0,tokens.length-1))]||'is';
      const mapped=correctionPairs[correctWord.toLowerCase()];
      const wrongWord=mapped||(correctWord.endsWith('s')?correctWord.slice(0,-1):correctWord+'s');
      const incorrect=sentence.replace(new RegExp(`\\b${correctWord}\\b`),wrongWord);
      output.push({id:`${item.id}-27-correct-${index+1}`,type:'correction',sectionType:'correction',prompt:'Write the correct word only.',displayPrompt:'',incorrect,wrongWord,correctWord,answer:correctWord,acceptedAnswers:[correctWord],correctSentence:sentence,incorrectParts:{before:incorrect.slice(0,incorrect.indexOf(wrongWord)),wrong:wrongWord,after:incorrect.slice(incorrect.indexOf(wrongWord)+wrongWord.length)},explain:item.grammar.tip});
    });
    output.push({id:`${item.id}-27-correct-4`,type:'correction',sectionType:'correction',prompt:'Write the correct word only.',displayPrompt:'',incorrect:'This lesson are important.',wrongWord:'are',correctWord:'is',answer:'is',acceptedAnswers:['is'],correctSentence:'This lesson is important.',incorrectParts:{before:'This lesson ',wrong:'are',after:' important.'},explain:'Use is with the singular subject lesson.'});
    (item.reading.points||[]).slice(0,4).forEach((sentence,index)=>output.push({id:`${item.id}-27-sequence-${index+1}`,type:'sequence',sectionType:'sequence',prompt:'Build the correct lesson sentence.',displayPrompt:'Build the correct lesson sentence.',items:sentence.replace(/[.!?]$/,'').split(/\s+/),answer:sentence,explain:'This sentence states an important lesson fact.'}));
    for(let group=0;group<3;group++){
      const entries=words.slice(group*2,group*2+4);
      output.push({id:`${item.id}-27-match-${group+1}`,type:'match',sectionType:'match',prompt:'Match each word with its meaning.',displayPrompt:'',pairs:entries.map(entry=>({left:entry.word,right:entry.def})),explain:'Use the vocabulary definitions from this lesson.'});
    }
    output.push({id:`${item.id}-27-sort-1`,type:'categorize',sectionType:'categorize',prompt:'Sort the ideas into the correct groups.',displayPrompt:'Sort the ideas into the correct groups.',categories:[{name:'Vocabulary',items:words.slice(0,3).map(entry=>entry.word)},{name:'Lesson facts',items:(item.reading.points||[]).slice(0,3)}],explain:'Words name key vocabulary; complete sentences state lesson facts.'});
    output.push({id:`${item.id}-27-write-1`,type:'writing',sectionType:'writing',prompt:`Write 4–5 sentences about ${item.title}.`,displayPrompt:`Write 4–5 sentences about ${item.title}.`,minWords:24,minSentences:4,requiredGroups:words.slice(0,3).map(entry=>[entry.word]),checklist:['Write a clear main idea.','Use at least three lesson words.','Add supporting details.','Check capitals and punctuation.'],placeholder:'Write your paragraph here...',explain:'Use lesson vocabulary, a clear main idea, supporting details, and correct punctuation.'});
    return selectThirty(output);
  }

  window.ConnectPlusCurriculum2027={apply,selectThirty,generatedQuestions,version:'2027.09-five-unit-curriculum'};
})();
