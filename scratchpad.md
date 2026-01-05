For ai_corrections, what if a user later changes the transaction's subcategory?

I.e. AI suggests, user changes subcategory, ai_corrections saves data, user then changes to different subcategory
Or, what if: AI suggests, user changes subcategory, ai_corrections saves data, user then changes that subcategory's name

Perhaps the ai_corrections should be tied to the subcategory via transaction uuid? That is, just look at the transaction uuid
