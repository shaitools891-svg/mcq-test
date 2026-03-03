import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  ArrowLeft, 
  RotateCcw, 
  Award,
  Clock,
  BookOpen,
  ChevronRight,
  LogOut
} from 'lucide-react';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import { useTimer } from '../hooks/useTimer';

// Get current profile info
const getProfileInfo = (): { name: string } | null => {
  const profileId = localStorage.getItem('selectedProfile');
  const profiles: Record<string, { name: string }> = {
    aliza: { name: 'Aliza' },
    eshita: { name: 'Eshita' },
    shapla: { name: 'Shapla' },
    shakib: { name: 'Shakib' }
  };
  return profileId ? (profiles[profileId] || null) : null;
};

interface Question {
  id: number;
  question: string;
  options: string[];
  answer_index: number;
  category: string;
  explanations?: Record<string, string>;
}

const questions: Question[] = [
  {
    id: 1,
    question: "নিচের কোন এনজাইমটি অ্যামাইলোলাইটিক?",
    options: ["পেপটাইডেজ", "লাইপেজ", "মল্টেজ", "ট্রিপসিন"],
    answer_index: 2,
    category: "Biology 2nd Paper",
    explanations: {
      "মল্টেজ": "এটি একটি অ্যামাইলোলাইটিক এনজাইম যা শর্করা (কার্বোহাইড্রেট) পরিপাকে সাহায্য করে।",
      "পেপটাইডেজ": "এগুলো প্রোটিওলাইটিক এনজাইম যা আমিষ (প্রোটিন) পরিপাক করে।",
      "ট্রিপসিন": "এগুলো প্রোটিওলাইটিক এনজাইম যা আমিষ (প্রোটিন) পরিপাক করে।",
      "লাইপেজ": "এটি লিপোলাইটিক এনজাইম যা চর্বি (লিপিড) পরিপাক করে।"
    }
  },
  {
    id: 2,
    question: "মানবদেহের কোন গ্রন্থিতে কাফফার কোষ পাওয়া যায়?",
    options: ["যকৃৎ", "অগ্ন্যাশয়", "পিটুইটারি", "লালাগ্রন্থি"],
    answer_index: 0,
    category: "Biology 2nd Paper",
    explanations: {
      "যকৃৎ": "যকৃতে কাফফার কোষ পাওয়া যায় যা রক্ত পরিশোধন ও আমাশয় প্রতিরোধে গুরুত্বপূর্ণ ভূমিকা পালন করে।",
      "অগ্ন্যাশয়": "অগ্ন্যাশয়ে কাফফার কোষ পাওয়া যায় না।",
      "পিটুইটারি": "পিটুইটারি গ্রন্থিতে কাফফার কোষ পাওয়া যায় না।",
      "লালাগ্রন্থি": "লালাগ্রন্থিতে কাফফার কোষ পাওয়া যায় না।"
    }
  },
  {
    id: 3,
    question: "নিচের কোন আয়নটি রক্ত জমাট বাঁধতে সাহায্য করে?",
    options: ["$Na^{+}$", "$Ca^{2+}$", "$Mg^{2+}$", "$Fe^{2+}$"],
    answer_index: 1,
    category: "Biology 2nd Paper",
    explanations: {
      "$Ca^{2+}$": "ক্যালসিয়াম আয়ন হলো ৪র্থ ক্লোটিং ফ্যাক্টর যা প্রোথ্রোম্বিনকে থ্রোম্বিনে রূপান্তর করতে অপরিহার্য।",
      "$Na^{+}$": "এগুলো প্রধানত স্নায়ু উদ্দীপনা ও এনজাইম কো-ফ্যাক্টর হিসেবে কাজ করে, রক্ত তঞ্চনে নয়।",
      "$Mg^{2+}$": "এগুলো প্রধানত স্নায়ু উদ্দীপনা ও এনজাইম কো-ফ্যাক্টর হিসেবে কাজ করে, রক্ত তঞ্চনে নয়।",
      "$Fe^{2+}$": "এটি হিমোগ্লোবিনের প্রধান উপাদান যা অক্সিজেন পরিবহনে কাজ করে।"
    }
  },
  {
    id: 4,
    question: "কোনটি সেরোটোনিন নামক রাসায়নিক পদার্থ ক্ষরণ করে?",
    options: ["লোহিত কণিকা", "লিম্ফোসাইট", "অণুচক্রিকা", "মনোসাইট"],
    answer_index: 2,
    category: "Biology 2nd Paper",
    explanations: {
      "লোহিত কণিকা": "লোহিত কণিকা অক্সিজেন পরিবহন করে, সেরোটোনিন নিঃসরণ করে না।",
      "লিম্ফোসাইট": "লিম্ফোসাইট রোগ প্রতিরোধে কাজ করে, সেরোটোনিন নিঃসরণ করে না।",
      "অণুচক্রিকা": "অণুচক্রিকা সেরোটোনিন ও হিস্টামিন নিঃসরণ করে যা রক্ত জমাট বাঁধতে ও প্রদাহে ভূমিকা রাখে।",
      "মনোসাইট": "মনোসাইট ফ্যাগোসাইটোসিসে কাজ করে, সেরোটোনিন নিঃসরণ করে না।"
    }
  },
  {
    id: 5,
    question: "মানবদেহে অতিরিক্ত ওজনের BMI কোনটি?",
    options: ["১৮.৫–২৪.৯৯ কেজি/$m^2$", "২৫.০–২৯.৯৯ কেজি/$m^2$", "৩০.০–৩৪.৯৯ কেজি/$m^2$", "৩৫.০–৩৯.৯৯ কেজি/$m^2$"],
    answer_index: 1,
    category: "Biology 2nd Paper",
    explanations: {
      "১৮.৫–২৪.৯৯ কেজি/$m^2$": "এটি স্বাভাবিক BMI যা স্বাস্থ্যকর ওজন নির্দেশ করে।",
      "২৫.০–২৯.৯৯ কেজি/$m^2$": "এটি অতিরিক্ত ওজন (Overweight) নির্দেশ করে।",
      "৩০.০–৩৪.৯৯ কেজি/$m^2$": "এটি স্থূলতা (Obesity Class I) নির্দেশ করে।",
      "৩৫.০–৩৯.৯৯ কেজি/$m^2$": "এটি গুরুতর স্থূলতা (Obesity Class II) নির্দেশ করে।"
    }
  },
  {
    id: 6,
    question: "উদ্দীপকটি (সাদা লেগহর্ন ও সাদা ওয়াইনডট) দ্বারা কোনটি নির্দেশিত হয়েছে?",
    options: ["অসম্পূর্ণ প্রকটতা", "পরিপূরক জিন", "প্রকট এপিস্ট্যাসিস", "সম-প্রকটতা"],
    answer_index: 2,
    category: "Genetics",
    explanations: {
      "অসম্পূর্ণ প্রকটতা": "অসম্পূর্ণ প্রকটতায় F1 জনুতে মধ্যবর্তী ফিনোটাইপ দেখা যায়।",
      "পরিপূরক জিন": "পরিপূরক জিনে দুটি ভিন্ন জিন একসাথে কাজ করে সম্পূর্ণ প্রকাশ তৈরি করে।",
      "প্রকট এপিস্ট্যাসিস": "প্রকট এপিস্ট্যাসিসে একটি জিনের প্রকট অ্যালিল অন্য জিনের প্রকাশকে বাধা দেয়। সাদা লেগহর্ন ও সাদা ওয়াইনডট এই নিয়ম প্রদর্শন করে।",
      "সম-প্রকটতা": "সম-প্রকটতায় দুটি ভিন্ন প্রকট অ্যালিল একসাথে প্রকাশ পায়।"
    }
  },
  {
    id: 7,
    question: "উদ্দীপক অনুসারে $F_2$ জনুতে ফিনোটাইপিক অনুপাত কত?",
    options: ["৯:৩:৩:১", "৯:৭", "১৩:৩", "১:২:১"],
    answer_index: 2,
    category: "Genetics",
    explanations: {
      "৯:৩:৩:১": "এটি সম্পূর্ণ প্রতিপালনের ফিনোটাইপিক অনুপাত।",
      "৯:৭": "এটি পরিপূরক জিনের অনুপাত।",
      "১৩:৩": "প্রকট এপিস্ট্যাসিসে F2 জনুতে ১৩:৩ ফিনোটাইপিক অনুপাত পাওয়া যায়।",
      "১:২:১": "এটি অসম্পূর্ণ প্রতিপালনের অনুপাত।"
    }
  },
  {
    id: 8,
    question: "করোতিকায় অস্থির সংখ্যা কতটি?",
    options: ["৮", "১৪", "২৫", "২৯"],
    answer_index: 0,
    category: "Human Skeleton",
    explanations: {
      "৮": "করোতিকায় (করোটির ভিত্তি) ৮টি অস্থি থাকে।",
      "১৪": "এটি মুখের হাড়ের সংখ্যা।",
      "২৫": "এটি মেরুদণ্ডের (কশেরুকা) সংখ্যা।",
      "২৯": "এটি পাঁজরের হাড়ের সংখ্যা।"
    }
  },
  {
    id: 9,
    question: "উদ্দীপকের চিত্র 'A' (শামুক) কোন পর্বের?",
    options: ["Platyhelminthes", "Mollusca", "Annelida", "Arthropoda"],
    answer_index: 1,
    category: "Animal Diversity",
    explanations: {
      "Platyhelminthes": "এটি সমতল কৃমি পর্ব, শামুক এই পর্বের অন্তর্গত নয়।",
      "Mollusca": "শামুক Mollusca পর্বের অন্তর্গত যার মূল বৈশিষ্ট্য নরম দেহ ও শেল।",
      "Annelida": "এটি প্রত্ন কৃমি পর্ব, শামুক এই পর্বের অন্তর্গত নয়।",
      "Arthropoda": "এটি খড়ম পর্ব, শামুক এই পর্বের অন্তর্গত নয়।"
    }
  },
  {
    id: 10,
    question: "উদ্দীপকের চিত্র 'B' (তারামাছ) এর বৈশিষ্ট্য— i. পঞ্চঅরীয় প্রতিসম ii. রক্ত সংবহনতন্ত্র উপস্থিত iii. চলন অঙ্গ নালিকাপদ",
    options: ["i ও ii", "i ও iii", "ii ও iii", "i, ii ও iii"],
    answer_index: 2,
    category: "Animal Diversity",
    explanations: {
      "i ও ii": "ভুল উত্তর। তারামাছ পঞ্চঅরীয় প্রতিসম নয়।",
      "i ও iii": "ভুল উত্তর। তারামাছে রক্ত সংবহনতন্ত্র আছে।",
      "ii ও iii": "সঠিক উত্তর। তারামাছে রক্ত সংবহনতন্ত্র আছে এবং চলন অঙ্গ নালিকাপদ আছে।",
      "i, ii ও iii": "ভুল উত্তর। তারামাছ পঞ্চঅরীয় প্রতিসম নয়।"
    }
  },
  {
    id: 11,
    question: "মানুষের হৃদপেশি হলো— i. অনৈচ্ছিক ii. শাখাযুক্ত iii. ইন্টারক্যালেটেড ডিস্কযুক্ত",
    options: ["i ও ii", "i ও iii", "ii ও iii", "i, ii ও iii"],
    answer_index: 3,
    category: "Human Physiology",
    explanations: {
      "i ও ii": "ভুল উত্তর। হৃদপেশিতে ইন্টারক্যালেটেড ডিস্কও আছে।",
      "i ও iii": "ভুল উত্তর। হৃদপেশি শাখাযুক্ত।",
      "ii ও iii": "ভুল উত্তর। হৃদপেশি অনৈচ্ছিক।",
      "i, ii ও iii": "সঠিক উত্তর। মানুষের হৃদপেশি অনৈচ্ছিক, শাখাযুক্ত এবং ইন্টারক্যালেটেড ডিস্কযুক্ত।"
    }
  },
  {
    id: 12,
    question: "মস্তিষ্কের কোন অংশে শ্বসনকেন্দ্র অবস্থিত?",
    options: ["পনস", "সেরিবেলাম", "সেরিব্রাম", "মধ্য মস্তিষ্ক"],
    answer_index: 0,
    category: "Human Physiology",
    explanations: {
      "পনস": "পনস-এ নিউমোট্যাক্সিক ও অ্যাপনিউস্টিক কেন্দ্র থাকে যা শ্বাসক্রিয়ার ছন্দ নিয়ন্ত্রণ করে।",
      "সেরিবেলাম": "এটি দেহের ভারসাম্য রক্ষা ও ঐচ্ছিক পেশির কাজ নিয়ন্ত্রণ করে।",
      "সেরিব্রাম": "এটি চিন্তা, স্মৃতি ও বুদ্ধিমত্তার কেন্দ্র।",
      "মধ্য মস্তিষ্ক": "এটি দর্শন ও শ্রবণ সংবেদনের সমন্বয় সাধন করে।"
    }
  },
  {
    id: 13,
    question: "Archaeopteryx-এ সরীসৃপের বৈশিষ্ট্য— i. চোয়ালে দাঁত ii. লেজ ২০টি কশেরুকা যুক্ত iii. সমাকৃতি বিশিষ্ট",
    options: ["i ও ii", "i ও iii", "ii ও iii", "i, ii ও iii"],
    answer_index: 0,
    category: "Evolution",
    explanations: {
      "i ও ii": "সঠিক উত্তর। Archaeopteryx এ চোয়ালে দাঁত আছে এবং লেজে ২০টি কশেরুকা আছে - এগুলো সরীসৃপের বৈশিষ্ট্য।",
      "i ও iii": "ভুল উত্তর। Archaeopteryx এ সমাকৃতি বিশিষ্ট নয়।",
      "ii ও iii": "ভুল উত্তর।",
      "i, ii ও iii": "ভুল উত্তর।"
    }
  },
  {
    id: 14,
    question: "মানুষের লালাগ্রন্থির কাজ হলো— i. আমিষ পরিপাক করা ii. টায়ালিন নিঃসৃত করা iii. খাদ্য গিলতে সাহায্য করা",
    options: ["i ও ii", "i ও iii", "ii ও iii", "i, ii ও iii"],
    answer_index: 2,
    category: "Human Physiology",
    explanations: {
      "i ও ii": "ভুল উত্তর। লালাগ্রন্থি আমিষ পাচ করে না।",
      "i ও iii": "ভুল উত্তর। লালাগ্রন্থি টায়ালিন নিঃসরণ করে।",
      "ii ও iii": "সঠিক উত্তর। লালাগ্রন্থি টায়ালিন নিঃসরণ করে এবং খাদ্য গিলতে সাহায্য করে।",
      "i, ii ও iii": "ভুল উত্তর।"
    }
  },
  {
    id: 15,
    question: "মানবদেহের বড় গ্রন্থি কোনটি?",
    options: ["থাইমাস", "প্লীহা", "অগ্ন্যাশয়", "যকৃৎ"],
    answer_index: 3,
    category: "Human Physiology",
    explanations: {
      "থাইমাস": "থাইমাস একটি গ্রন্থি কিন্তু বৃহত্তম নয়।",
      "প্লীহা": "প্লীহা বৃহত্তম লিম্ফয়েড অঙ্গ কিন্তু বৃহত্তম গ্রন্থি নয়।",
      "অগ্ন্যাশয়": "অগ্ন্যাশয় একটি গ্রন্থি কিন্তু বৃহত্তম নয়।",
      "যকৃৎ": "যকৃৎ মানবদেহের বৃহত্তম গ্রন্থি যা পিত্ত তৈরি, বিপাক ও বিষাক্ত পদার্থ পরিশোধনে কাজ করে।"
    }
  },
  {
    id: 16,
    question: "সারফেকট্যান্ট কোথায় পাওয়া যায়?",
    options: ["ব্রঙ্কিওল", "ট্রাকিয়া", "ব্রঙ্কাস", "অ্যালভিওলাসে"],
    answer_index: 3,
    category: "Human Physiology",
    explanations: {
      "ব্রঙ্কিওল": "ব্রঙ্কিওলে সারফেকট্যান্ট পাওয়া যায় না।",
      "ট্রাকিয়া": "ট্রাকিয়ায় সারফেকট্যান্ট পাওয়া যায় না।",
      "ব্রঙ্কাস": "ব্রঙ্কাসে সারফেকট্যান্ট পাওয়া যায় না।",
      "অ্যালভিওলাসে": "সারফেকট্যান্ট অ্যালভিওলাসে পাওয়া যায় যা ফুসফুসের বায়ুথলিকে সঙ্কুচিত হতে বাধা দেয়।"
    }
  },
  {
    id: 17,
    question: "নিচের কোনটি 'সরীসৃপের যুগ' বলা হয়?",
    options: ["সিনোজোয়িক", "মেসোজোয়িক", "প্যালিওজোয়িক", "প্রোটেরোজোয়িক"],
    answer_index: 1,
    category: "Evolution",
    explanations: {
      "সিনোজোয়িক": "সিনোজোয়িক যুগ স্তন্যপায়ীদের যুগ।",
      "মেসোজোয়িক": "মেসোজোয়িক যুগ (২৫২-৬৬ মিলিয়ন বছর আগে) সরীসৃপের যুগ নামে পরিচিত যেখানে ডাইনোসর প্রধান ছিল।",
      "প্যালিওজোয়িক": "প্যালিওজোয়িক যুগে সামুদ্রিক প্রাণী ও কীটপতঙ্গ প্রধান ছিল।",
      "প্রোটেরোজোয়িক": ""
    }
  },
  {
    id: 18,
    question: "কোনটি হেপারিন নিঃসরণ করে?",
    options: ["নিউট্রোফিল", "ইওসিনোফিল", "বেসোফিল", "মনোসাইট"],
    answer_index: 2,
    category: "Human Physiology",
    explanations: {
      "নিউট্রোফিল": "নিউট্রোফিল ব্যাকটেরিয়া ফ্যাগোসাইটোসিসে কাজ করে, হেপারিন নিঃসরণ করে না।",
      "ইওসিনোফিল": "ইওসিনোফিল অ্যালার্জি প্রতিক্রিয়া ও প্যারাসাইট নিয়ন্ত্রণে কাজ করে, হেপারিন নিঃসরণ করে না।",
      "বেসোফিল": "বেসোফিল হেপারিন ও হিস্টামিন নিঃসরণ করে যা রক্ত জমাট বাঁধতে বাধা দেয় ও অ্যালার্জি প্রতিক্রিয়া সৃষ্টি করে।",
      "মনোসাইট": "মনোসাইট ফ্যাগোসাইটোসিসে কাজ করে, হেপারিন নিঃসরণ করে না।"
    }
  },
  {
    id: 19,
    question: "হাইড্রার কোন ধরনের নেমাটোসিস্ট হিপনোটক্সিন ধারণ করে?",
    options: ["পেনিট্র্যান্ট", "ভলভেন্ট", "স্ট্রেপ্টোলিন গ্লুটিন্যান্ট", "স্টিরিওলিন গ্লুটিন্যান্ট"],
    answer_index: 0,
    category: "Hydra",
    explanations: {
      "পেনিট্র্যান্ট": "পেনিট্র্যান্ট নেমাটোসিস্ট হিপনোটক্সিন ধারণ করে যা শিকারকে প্যারালাইজ করে।",
      "ভলভেন্ট": "ভলভেন্ট নেমাটোসিস্ট স্টিকিং টক্সিন ধারণ করে।",
      "স্ট্রেপ্টোলিন গ্লুটিন্যান্ট": "এটি আঠালো নেমাটোসিস্ট।",
      "স্টিরিওলিন গ্লুটিন্যান্ট": "এটি আঠালো নেমাটোসিস্ট।"
    }
  },
  {
    id: 20,
    question: "উদ্দীপকের 'A' (মাছের হৃদপিণ্ড) চিহ্নিত অংশটির নাম কী?",
    options: ["শ্বাসনালি", "গলবিল", "নিউম্যাটিক নালি", "বাল্বাস আর্টারিওসাস"],
    answer_index: 3,
    category: "Fish Physiology",
    explanations: {
      "শ্বাসনালি": "শ্বাসনালি শ্বাসকার্যে কাজ করে, মাছের হৃদপিণ্ডের অংশ নয়।",
      "গলবিল": "গলবিল খাদ্য পথের অংশ।",
      "নিউম্যাটিক নালি": "নিউম্যাটিক নালি বায়ুথলির সাথে সম্পর্কিত।",
      "বাল্বাস আর্টারিওসাস": "বাল্বাস আর্টারিওসাস মাছের হৃদপিণ্ডের একটি গুরুত্বপূর্ণ অংশ যেখান থেকে রক্ত বের হয়।"
    }
  },
  {
    id: 21,
    question: "উদ্দীপকটির (পটকা) কাজ হলো— i. প্লবতা রক্ষা করা ii. CO2 এর আধার হিসেবে কাজ করা iii. শব্দ উৎপাদনে সহায়তা করা",
    options: ["i ও ii", "i ও iii", "ii ও iii", "i, ii ও iii"],
    answer_index: 0,
    category: "Fish Physiology",
    explanations: {
      "i ও ii": "সঠিক উত্তর। পটকা প্লবতা রক্ষা করে এবং CO2 এর আধার হিসেবে কাজ করে।",
      "i ও iii": "ভুল উত্তর। পটকা শব্দ উৎপাদনে সহায়তা করে না।",
      "ii ও iii": "ভুল উত্তর। পটকা প্লবতা রক্ষা করে।",
      "i, ii ও iii": "ভুল উত্তর।"
    }
  },
  {
    id: 22,
    question: "মানব হৃদপিণ্ডে ভেন্ট্রিকলের ডায়াস্টোলের সময়কাল কত?",
    options: ["০.৭ সে.", "০.১ সে.", "০.৫ সে.", "০.৩ সে."],
    answer_index: 2,
    category: "Human Physiology",
    explanations: {
      "০.৭ সে.": "এটি সিস্টোলের মোট সময়কাল।",
      "০.১ সে.": "এটি অ্যাট্রিয়াল সিস্টোলের সময়কাল।",
      "০.৫ সে.": "ভেন্ট্রিকলের ডায়াস্টোলের সময়কাল ০.৫ সেকেন্ড।",
      "০.৩ সে.": "এটি ভেন্ট্রিকলের সিস্টোলের সময়কাল।"
    }
  },
  {
    id: 23,
    question: "ঘাসফড়িংয়ের ওমাটিডিয়ামে কোন অংশটি লেন্সের মতো কাজ করে?",
    options: ["কর্নিয়া", "ক্রিস্টালাইন কোণ", "আইরিশ রঞ্জক আবরণ", "র্যাবডোম"],
    answer_index: 1,
    category: "Grasshopper",
    explanations: {
      "কর্নিয়া": "কর্নিয়া আলো প্রবেশ করে কিন্তু লেন্সের মতো কাজ করে না।",
      "ক্রিস্টালাইন কোণ": "ক্রিস্টালাইন কোণ ওমাটিডিয়ামের লেন্সের মতো অংশ যা আলোকে ফোকাস করে।",
      "আইরিশ রঞ্জক আবরণ": "আইরিশ রঞ্জক আবরণ রঙ নির্ধারণে কাজ করে।",
      "র্যাবডোম": "র্যাবডোম আলো সংবেদী অংশ যা ফটোরিসেপ্টর হিসেবে কাজ করে।"
    }
  },
  {
    id: 24,
    question: "নিচের কোন প্রাণীটিতে প্লাকয়েড আঁইশ বিদ্যমান?",
    options: ["Myxine", "Petromyzon", "Scoliodon", "Branchiostoma"],
    answer_index: 2,
    category: "Animal Diversity",
    explanations: {
      "Scoliodon": "এটি তরুণাস্থিময় মাছ (হাঙর), এদের ত্বকে ক্ষুদ্র কাঁটার মতো প্লাকয়েড আঁইশ থাকে।",
      "Myxine": "এরা চোয়ালহীন মাছ (Cyclostomata), এদের কোনো আঁইশ থাকে না।",
      "Petromyzon": "এরা চোয়ালহীন মাছ (Cyclostomata), এদের কোনো আঁইশ থাকে না।",
      "Branchiostoma": "এটি একটি কর্ডাটা প্রাণী (Cephalochordata), এদেরও কোনো আঁইশ নেই।"
    }
  },
  {
    id: 25,
    question: "হায়ালিন তরুণাস্থির বৈশিষ্ট্য হলো— i. ম্যাট্রিক্স অস্বচ্ছ ii. তন্তুবহীন iii. নমনীয়",
    options: ["i ও ii", "i ও iii", "ii ও iii", "i, ii ও iii"],
    answer_index: 2,
    category: "Human Physiology",
    explanations: {
      "i ও ii": "ভুল উত্তর। হায়ালিন তরুণাস্থি নমনীয়।",
      "i ও iii": "ভুল উত্তর। হায়ালিন তরুণাস্থি তন্তুবহীন।",
      "ii ও iii": "সঠিক উত্তর। হায়ালিন তরুণাস্থি তন্তুবহীন ও নমনীয়।",
      "i, ii ও iii": "ভুল উত্তর। হায়ালিন তরুণাস্থি স্বচ্ছ।"
    }
  }
];

const optionLabels = ['ক', 'খ', 'গ', 'ঘ'];

// Helper function to render text with LaTeX formulas
const renderWithLatex = (text: string) => {
  // Split by LaTeX delimiters $...$
  const parts = text.split(/(\$[^$]+\$)/g);
  return parts.map((part, index) => {
    if (part.startsWith('$') && part.endsWith('$')) {
      // Extract LaTeX content without $
      const latex = part.slice(1, -1);
      try {
        return <InlineMath key={index} math={latex} />;
      } catch {
        return <span key={index}>{part}</span>;
      }
    }
    return <span key={index}>{part}</span>;
  });
};

const TOTAL_TIME_25_QUESTIONS = 15 * 60; // 15 minutes in seconds
const TOTAL_TIME_30_QUESTIONS = 20 * 60; // 20 minutes in seconds

// Determine time limit based on number of questions
const getTimeLimit = (questionCount: number) => {
  if (questionCount <= 25) {
    return TOTAL_TIME_25_QUESTIONS;
  }
  return TOTAL_TIME_30_QUESTIONS;
};

export default function MCQTest() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>(new Array(questions.length).fill(-1));
  const [showResults, setShowResults] = useState(false);
  
  // Store final time when test ends
  const [finalTimeLeft, setFinalTimeLeft] = useState(0);
  const [finalFormattedTime, setFinalFormattedTime] = useState('00:00');
  
  // Subject/Board selection state
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedPaper, setSelectedPaper] = useState<string | null>(null);
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [testStarted, setTestStarted] = useState(false);
  
  // Profile menu state
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Use the timer hook
  const { timeLeft, isRunning, formattedTime, reset: resetTimer, pause: pauseTimer, resume: resumeTimer } = useTimer({ 
    questionCount: questions.length,
    onTimeUp: () => setShowResults(true)
  });

  // Calculate the time limit for display
  const timeLimit = getTimeLimit(questions.length);

  // Calculate elapsed time for display in results (for consistency)
  const timeElapsed = timeLimit - timeLeft;

  const handleSelectAnswer = (optionIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = optionIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    // Store the final time values before pausing
    setFinalTimeLeft(timeLeft);
    setFinalFormattedTime(formattedTime);
    
    try {
      if (pauseTimer) pauseTimer();
    } catch (e) {
      console.log('Timer pause error:', e);
    }
    setShowResults(true);
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setSelectedAnswers(new Array(questions.length).fill(-1));
    setShowResults(false);
    setFinalTimeLeft(0);
    setFinalFormattedTime('00:00');
    try {
      if (resetTimer) resetTimer();
    } catch (e) {
      console.log('Timer reset error:', e);
    }
    // Also reset selection state to go back to selection screen
    setTestStarted(false);
    setSelectedSubject(null);
    setSelectedPaper(null);
    setSelectedBoard(null);
  };

  const calculateScore = () => {
    let correct = 0;
    selectedAnswers.forEach((answer, index) => {
      if (answer === questions[index].answer_index) {
        correct++;
      }
    });
    return correct;
  };

  const getScorePercentage = () => {
    return Math.round((calculateScore() / questions.length) * 100);
  };

  const getScoreMessage = () => {
    const percentage = getScorePercentage();
    if (percentage >= 80) return "Excellent! Outstanding performance! 🎉";
    if (percentage >= 60) return "Good job! Keep it up! 👍";
    if (percentage >= 40) return "Not bad! Room for improvement! 📚";
    return "Keep practicing! You'll do better! 💪";
  };

  if (showResults) {
    const score = calculateScore();
    const percentage = getScorePercentage();

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 p-6 mb-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 mb-4">
                <Award className="w-10 h-10 text-amber-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                কুমিল্লা বোর্ড ২০২৩ - জীববিজ্ঞান ২য় পত্র
              </h1>
              <p className="text-gray-600 dark:text-gray-400">MCQ Test Results</p>
            </div>
          </div>

          {/* Score Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 p-8 mb-6">
            <div className="text-center">
              <div className="text-6xl font-black text-amber-500 mb-2">
                {score}/{questions.length}
              </div>
              <div className="text-3xl font-bold text-gray-700 dark:text-gray-300 mb-4">
                {percentage}%
              </div>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                {getScoreMessage()}
              </p>
              <div className="flex items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Time: {finalFormattedTime || formattedTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Correct: {score}</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span>Wrong: {questions.length - score}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Answer Review */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Answer Review
            </h2>
            <div className="space-y-4">
              {questions.map((q, idx) => {
                const userAnswer = selectedAnswers[idx];
                const isCorrect = userAnswer === q.answer_index;
                const isUnanswered = userAnswer === -1;

                return (
                  <div 
                    key={q.id} 
                    className={`p-4 rounded-xl border ${
                      isCorrect 
                        ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20' 
                        : isUnanswered
                        ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'
                        : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        isCorrect 
                          ? 'bg-emerald-500 text-white' 
                          : isUnanswered
                          ? 'bg-amber-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}>
                        {q.id}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900 dark:text-white font-medium mb-2">{renderWithLatex(q.question)}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          {q.options.map((opt, optIdx) => (
                            <div
                              key={optIdx}
                              className={`px-3 py-2 rounded-lg ${
                                optIdx === q.answer_index
                                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium'
                                  : optIdx === userAnswer && !isCorrect
                                  ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 line-through'
                                  : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400'
                              }`}
                            >
                              {optionLabels[optIdx]}. {renderWithLatex(opt)}
                            </div>
                          ))}
                        </div>
                        {isUnanswered && (
                          <p className="text-amber-600 dark:text-amber-400 text-sm mt-2">Not answered</p>
                        )}
                        {/* Show explanations for each option */}
                        {q.explanations && (
                          <div className="mt-3 space-y-2">
                            {q.options.map((opt, optIdx) => {
                              const explanation = q.explanations?.[opt];
                              if (!explanation) return null;
                              const isCorrectOption = optIdx === q.answer_index;
                              return (
                                <div 
                                  key={optIdx}
                                  className={`p-3 rounded-lg text-sm ${
                                    isCorrectOption 
                                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-500'
                                      : 'bg-gray-50 dark:bg-zinc-800 border-l-4 border-gray-300 dark:border-zinc-600'
                                  }`}
                                >
                                  <span className={`font-medium ${isCorrectOption ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-600 dark:text-gray-400'}`}>
                                    {optionLabels[optIdx]}. 
                                  </span>
                                  <span className={isCorrectOption ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}>
                                    {explanation}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Restart Button */}
          <div className="text-center">
            <button
              onClick={handleRestart}
              className="inline-flex items-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
            >
              <RotateCcw className="w-5 h-5" />
              Take Test Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const answeredCount = selectedAnswers.filter(a => a !== -1).length;
  const profile = getProfileInfo();

  // Subject selection screen
  if (!testStarted) {
    const subjects = [
      { id: 'biology', name: 'Biology', nameBn: 'জীববিজ্ঞান', icon: '🧬' },
      { id: 'chemistry', name: 'Chemistry', nameBn: 'রসায়ন', icon: '⚗️', disabled: true },
      { id: 'physics', name: 'Physics', nameBn: 'পদার্থবিদ্যা', icon: '⚛️', disabled: true },
      { id: 'math', name: 'Math', nameBn: 'গণিত', icon: '📐', disabled: true },
    ];

    const papers = [
      { id: '1st', name: 'Paper 1st', nameBn: '১ম পত্র' },
      { id: '2nd', name: 'Paper 2nd', nameBn: '২য় পত্র' },
    ];

    const boards = [
      { id: 'comilla', name: 'Comilla', nameBn: 'কুমিল্লা বোর্ড', year: '2023' },
      { id: 'dhaka', name: 'Dhaka', nameBn: 'ঢাকা বোর্ড', year: '2023', disabled: true },
      { id: 'rajshahi', name: 'Rajshahi', nameBn: 'রাজশাহী বোর্ড', year: '2023', disabled: true },
      { id: 'chittagong', name: 'Chittagong', nameBn: 'চট্টগ্রাম বোর্ড', year: '2023', disabled: true },
      { id: 'barisal', name: 'Barisal', nameBn: 'বরিশাল বোর্ড', year: '2023', disabled: true },
      { id: 'sylhet', name: 'Sylhet', nameBn: 'সিলেট বোর্ড', year: '2023', disabled: true },
      { id: 'dinajpur', name: 'Dinajpur', nameBn: 'দিনাজপুর বোর্ড', year: '2023', disabled: true },
      { id: 'mymensingh', name: 'Mymensingh', nameBn: 'ময়মনসিংহ বোর্ড', year: '2023', disabled: true },
    ];

    const isSubjectSelected = selectedSubject !== null;
    const isPaperSelected = selectedPaper !== null;
    const isBoardSelected = selectedBoard !== null;
    const canStartTest = isSubjectSelected && isPaperSelected && isBoardSelected;

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Profile Avatar in Top Right */}
          {profile && (
            <div className="fixed top-4 right-4 z-50">
              <div 
                className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center shadow-lg cursor-pointer"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                title={profile.name}
              >
                <span className="text-white font-bold text-sm">{profile.name[0]}</span>
              </div>
              
              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-700 py-2">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-zinc-700">
                    <p className="font-medium text-gray-900 dark:text-white">{profile.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">Student</p>
                  </div>
                  <button
                    onClick={() => {
                      localStorage.removeItem('selectedProfile');
                      window.location.href = '/';
                    }}
                    className="w-full px-4 py-2 text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Selection Screen */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Select Exam Type
            </h1>

            {/* Subject Selection */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Subject</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {subjects.map((subject) => (
                  <button
                    key={subject.id}
                    onClick={() => !subject.disabled && setSelectedSubject(subject.id)}
                    disabled={subject.disabled}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      subject.disabled
                        ? 'border-gray-200 dark:border-zinc-700 opacity-50 cursor-not-allowed'
                        : selectedSubject === subject.id
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20'
                        : 'border-gray-200 dark:border-zinc-700 hover:border-rose-300 dark:hover:border-rose-700'
                    }`}
                  >
                    <div className="text-3xl mb-2">{subject.icon}</div>
                    <div className="font-medium text-gray-900 dark:text-white">{subject.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{subject.nameBn}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Paper Selection */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Paper</h2>
              <div className="grid grid-cols-2 gap-4">
                {papers.map((paper) => (
                  <button
                    key={paper.id}
                    onClick={() => setSelectedPaper(paper.id)}
                    disabled={!selectedSubject}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      !selectedSubject
                        ? 'border-gray-200 dark:border-zinc-700 opacity-50 cursor-not-allowed'
                        : selectedPaper === paper.id
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20'
                        : 'border-gray-200 dark:border-zinc-700 hover:border-rose-300 dark:hover:border-rose-700'
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-white">{paper.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{paper.nameBn}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Board Selection */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Board & Year</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {boards.map((board) => (
                  <button
                    key={board.id}
                    onClick={() => !board.disabled && setSelectedBoard(board.id)}
                    disabled={!selectedPaper || board.disabled}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      !selectedPaper || board.disabled
                        ? 'border-gray-200 dark:border-zinc-700 opacity-50 cursor-not-allowed'
                        : selectedBoard === board.id
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20'
                        : 'border-gray-200 dark:border-zinc-700 hover:border-rose-300 dark:hover:border-rose-700'
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-white">{board.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{board.nameBn}</div>
                    <div className="text-xs text-amber-500 font-medium">{board.year}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={() => setTestStarted(true)}
              disabled={!canStartTest}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                canStartTest
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg'
                  : 'bg-gray-200 dark:bg-zinc-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
            >
              Start Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Profile Avatar in Top Right */}
        {profile && (
          <div className="fixed top-4 right-4 z-50">
            <div 
              className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center shadow-lg cursor-pointer"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              title={profile.name}
            >
              <span className="text-white font-bold text-sm">{profile.name[0]}</span>
            </div>
            
            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-700 py-2">
                <div className="px-4 py-2 border-b border-gray-200 dark:border-zinc-700">
                  <p className="font-medium text-gray-900 dark:text-white">{profile.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">Student</p>
                </div>
                <button
                  onClick={() => {
                    localStorage.removeItem('selectedProfile');
                    window.location.href = '/';
                  }}
                  className="w-full px-4 py-2 text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        )}

        {/* Header */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                কুমিল্লা বোর্ড ২০২৩
              </h1>
              <p className="text-gray-600 dark:text-gray-400">জীববিজ্ঞান ২য় পত্র (MCQ)</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <Clock className="w-4 h-4 text-amber-500" />
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  {formattedTime}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-bold text-amber-500">{answeredCount}</span>/{questions.length} answered
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="h-2 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span>Question {currentQuestion + 1} of {questions.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 p-6 mb-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 w-12 h-12 bg-amber-500 text-white rounded-xl flex items-center justify-center font-bold text-lg">
              {currentQ.id}
            </div>
            <div className="flex-1">
              <p className="text-lg font-medium text-gray-900 dark:text-white leading-relaxed">
                {renderWithLatex(currentQ.question)}
              </p>
              <span className="inline-block mt-2 text-xs px-3 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 rounded-full">
                {currentQ.category}
              </span>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQ.options.map((option, idx) => {
              const isSelected = selectedAnswers[currentQuestion] === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectAnswer(idx)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                      : 'border-gray-200 dark:border-zinc-700 hover:border-amber-300 dark:hover:border-amber-700 hover:bg-gray-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                    isSelected
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400'
                  }`}
                  >
                    {optionLabels[idx]}
                  </div>
                  <span className={`flex-1 ${
                    isSelected ? 'text-amber-700 dark:text-amber-300 font-medium' : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {renderWithLatex(option)}
                  </span>
                  {isSelected && (
                    <CheckCircle2 className="w-5 h-5 text-amber-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>

          {/* Question Navigator Dots */}
          <div className="hidden sm:flex items-center gap-1">
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestion(idx)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  idx === currentQuestion
                    ? 'w-6 bg-amber-500'
                    : selectedAnswers[idx] !== -1
                    ? 'bg-emerald-400'
                    : 'bg-gray-300 dark:bg-zinc-600'
                }`}
              />
            ))}
          </div>

          {currentQuestion === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
            >
              Submit
              <CheckCircle2 className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Navigation */}
        <div className="mt-8 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 p-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Quick Navigation</p>
          <div className="grid grid-cols-10 sm:grid-cols-10 gap-2">
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestion(idx)}
                className={`w-full aspect-square rounded-lg text-sm font-bold transition-all duration-200 ${
                  idx === currentQuestion
                    ? 'bg-amber-500 text-white'
                    : selectedAnswers[idx] !== -1
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50'
                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-amber-500 rounded"></div>
              <span>Current</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-emerald-100 dark:bg-emerald-900/30 rounded border border-emerald-300"></div>
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-100 dark:bg-zinc-800 rounded border border-gray-300"></div>
              <span>Not answered</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
