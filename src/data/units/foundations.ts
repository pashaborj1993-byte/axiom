import type { Unit } from "../types";
import { foundationsMore } from "./ladder";

export const foundations: Unit = {
  id: "foundations",
  title: "Foundations",
  blurb: "What the word AI is actually doing.",
  guide: [
    "AI is a family of techniques, not one mind.",
    "A model is a learned mapping. A product wraps it.",
    "Training sets the weights. Inference uses them.",
    "This wave is data, compute, and architecture together.",
  ],
  lessons: [
    {
      id: "foundations-meaning",
      title: "What “AI” points at",
      idea: "“AI” is a label for software that does work we associate with intelligence — spotting, predicting, generating — usually by learning patterns from data instead of a handwritten rule for every case.",
      exercises: [
        {
          id: "foundations-meaning-1",
          type: "choice",
          prompt: "A weather widget that always shows rain when humidity is above 80% is best described as…",
          options: [
            "A model trained on examples",
            "A fixed rule a person wrote",
            "A general intelligence",
            "A neural network by definition",
          ],
          answer: "A fixed rule a person wrote",
          explain:
            "If a person wrote the condition, it is a rule. Learning systems adjust from examples instead of listing every case in advance.",
        },
        {
          id: "foundations-meaning-2",
          type: "choice",
          prompt: "Which is the clearest case of a learned system?",
          options: [
            "Sorting a list with a published algorithm",
            "A calculator adding two numbers",
            "A spam filter that improves from mail people marked",
            "A clock",
          ],
          answer: "A spam filter that improves from mail people marked",
          explain:
            "The filter’s behavior comes from examples, not from a complete list of spam phrases written ahead of time.",
        },
        {
          id: "foundations-meaning-3",
          type: "truefalse",
          prompt: "“Artificial intelligence” names one specific algorithm.",
          answer: false,
          explain:
            "It is an umbrella. Search, classic machine learning, and neural networks are different techniques that get grouped under the same word.",
        },
        {
          id: "foundations-meaning-4",
          type: "fill",
          prompt: "Software that improves its behavior from examples is said to ____ from data.",
          answer: "learn",
          accept: ["train"],
          explain:
            "“Learn” here is technical, not human. The system adjusts internal numbers so outputs line up better with the examples.",
        },
        {
          id: "foundations-meaning-5",
          type: "choice",
          prompt: "Narrow AI means a system that…",
          options: [
            "Aims at particular tasks",
            "Understands everything a person does",
            "Uses almost no data",
            "Only runs on a phone",
          ],
          answer: "Aims at particular tasks",
          explain:
            "Nearly every system you use is narrow: strong at translation, photos, or a game, not a general mind.",
        },
      ],
    },
    {
      id: "foundations-models",
      title: "Models, not magic",
      idea: "A model is what training produces: a bundle of numbers plus a procedure that turns an input into an output. The product people touch is that model plus an interface, tools, and rules around it.",
      exercises: [
        {
          id: "foundations-models-1",
          type: "choice",
          prompt: "In Axiom, a “model” means…",
          options: [
            "The chat box you type into",
            "A learned mapping from inputs to outputs",
            "The company that sells the app",
            "A database of every fact",
          ],
          answer: "A learned mapping from inputs to outputs",
          explain:
            "The window is an interface. The model is the learned mapping. The product wraps both, plus policies and tools.",
        },
        {
          id: "foundations-models-2",
          type: "truefalse",
          prompt:
            "A famous model name means the system stores a copy of the web it can look up like a search engine.",
          answer: false,
          explain:
            "Typical generative models do not query the web unless a product adds that tool. They produce text from parameters set during training.",
        },
        {
          id: "foundations-models-3",
          type: "choice",
          prompt: "Parameters are…",
          options: [
            "The user’s password",
            "The prompts people type",
            "The adjustable numbers inside a model",
            "The laws that regulate AI",
          ],
          answer: "The adjustable numbers inside a model",
          explain: "Training sets those numbers. Inference uses them. You do not usually edit them by hand.",
        },
        {
          id: "foundations-models-4",
          type: "match",
          prompt: "Match each word to its meaning.",
          pairs: [
            { left: "Model", right: "Learned mapping" },
            { left: "Prompt", right: "Input at use time" },
            { left: "Parameter", right: "Number inside" },
          ],
          explain: "Keeping these words apart prevents a lot of muddy arguments about “what the AI did.”",
        },
        {
          id: "foundations-models-5",
          type: "choice",
          prompt: "Two apps on the “same model” can still differ because…",
          options: [
            "Models ignore the product around them",
            "System prompts, tools, and filters can differ",
            "Parameters change on every keystroke",
            "Identical models cannot be shared",
          ],
          answer: "System prompts, tools, and filters can differ",
          explain: "What you experience is the whole system, not the raw model alone.",
        },
      ],
    },
    {
      id: "foundations-phases",
      title: "Training and using",
      idea: "Training is the expensive pass that sets parameters from data. Inference is using those parameters on a new input. Most people only ever do inference.",
      exercises: [
        {
          id: "foundations-phases-1",
          type: "choice",
          prompt: "You paste a paragraph and get a rewrite. That step is…",
          options: ["Inference", "Training from scratch", "Labeling a dataset", "Gradient descent"],
          answer: "Inference",
          explain: "The app is applying a model that was already trained. Your click did not retrain it from scratch.",
        },
        {
          id: "foundations-phases-2",
          type: "fill",
          prompt: "The phase that sets a model’s parameters from data is called ____.",
          answer: "training",
          accept: ["train"],
          explain: "Training adjusts parameters. Using the finished model on new inputs is inference.",
        },
        {
          id: "foundations-phases-3",
          type: "truefalse",
          prompt: "A single reply is usually far cheaper than training the model the first time.",
          answer: true,
          explain: "Training can take huge clusters. One reply is a forward pass, plus whatever the product adds around it.",
        },
        {
          id: "foundations-phases-4",
          type: "order",
          prompt: "Put a typical model’s life in order. First step on top.",
          items: [
            "Collect or license data",
            "Train the parameters",
            "Test on held-out examples",
            "Serve the model for inference",
          ],
          explain: "Testing is not optional polish. It is how you learn whether training did more than memorize.",
        },
        {
          id: "foundations-phases-5",
          type: "choice",
          prompt: "Fine-tuning means…",
          options: [
            "Deleting the model",
            "Further training on a narrower dataset",
            "Changing only the app’s color",
            "Typing a longer prompt",
          ],
          answer: "Further training on a narrower dataset",
          explain: "A prompt changes the input for one call. Fine-tuning changes parameters using extra examples.",
        },
      ],
    },
    ...foundationsMore,
    {
      id: "foundations-wave",
      title: "Why this wave",
      idea: "The recent jump is not one trick. It is data at scale, compute (especially GPUs), architectures that train well, and products that put the result in front of people.",
      checkpoint: true,
      exercises: [
        {
          id: "foundations-wave-1",
          type: "choice",
          prompt: "Which story best explains the leap in language models?",
          options: [
            "Scale of data and compute, plus architectures that use them",
            "A new law of physics found in 2022",
            "Models that no longer need data",
            "The end of narrow AI",
          ],
          answer: "Scale of data and compute, plus architectures that use them",
          explain: "The ideas and the industrial scale arrived together. Neither one, alone, is the whole story.",
        },
        {
          id: "foundations-wave-2",
          type: "truefalse",
          prompt: "“Scale” means data stopped mattering.",
          answer: false,
          explain: "More parameters without useful data memorize noise or fail. Coverage and quality still decide what a model can represent.",
        },
        {
          id: "foundations-wave-3",
          type: "choice",
          prompt: "GPUs matter for modern training mostly because they…",
          options: [
            "Replace the need for algorithms",
            "Run many number operations in parallel",
            "Store the internet",
            "Understand language on their own",
          ],
          answer: "Run many number operations in parallel",
          explain: "Training is enormous linear algebra. GPUs are built for that kind of parallel math.",
        },
        {
          id: "foundations-wave-4",
          type: "choice",
          prompt: "A fluent demo is evidence that…",
          options: [
            "The system is generally intelligent",
            "The system can produce fluent output in that setting",
            "It has no failure modes",
            "Training is finished forever",
          ],
          answer: "The system can produce fluent output in that setting",
          explain: "Fluency is a surface. You still test accuracy and behavior on the tasks you actually care about.",
        },
        {
          id: "foundations-wave-5",
          type: "match",
          prompt: "Match each ingredient of this wave.",
          pairs: [
            { left: "Data", right: "Examples to learn from" },
            { left: "Compute", right: "Hardware time" },
            { left: "Architecture", right: "The model’s structure" },
          ],
          explain: "Hype usually points at one of these and ignores the others. You want all three in view.",
        },
      ],
    },
  ],
};
