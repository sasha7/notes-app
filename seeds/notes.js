/* eslint-disable arrow-body-style */

exports.seed = (knex, Promise) => {
  // Deletes ALL existing entries
  return knex('notes').del()
    .then(() => Promise.all([
      // Inserts seed entries
      knex('notes').insert({ title: 'Myth of Prometheus', body: 'In this famous Greek Myth, Prometheus, a powerful deity known as a Titan, decided to give the gift of fire to mankind. Zeus punished him, forcing him to be tortured for the rest of eternity!' }),
      knex('notes').insert({ title: 'Myth of Hercules', body: 'Hercules (known in Greek as Herakles) was a half-god, the son of Zeus. He is known for his many adventures, such as the defeat of the nine-headed Hydra, capturing the Erymanthian Boar, clashing with a giant known as Antaeus, and stealing cattle from a fearsome monster.' }),
      knex('notes').insert({ title: 'Myth of Zeus', body: 'Zeus is the Father of the Gods on Mount Olympus. He became the King after a clash with the Titans. His brothers were said to be Poseidon, the King of the Sea, and Hades, the King of the Underworld.' }),
      knex('notes').insert({ title: 'Myth of Jason and the Argounauts', body: 'Jason was a hero, a very good-looking and charming man who was very handy with a sword. He had a strong vessel built called the Argo, and his crew, the Argonauts, went on a dangerous expedition to the far-away land of Kolhida.' })
    ]));
};
