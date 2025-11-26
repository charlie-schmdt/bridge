import { extendVariants, Button as HeroButton } from '@heroui/react';

// Make sure not to duplicate base style attributes in the variant string
const BASE =  "px-5 py-2 w-fit rounded-lg transition cursor-pointer font-semibold "; // end with space

export const Button = extendVariants(HeroButton, {
  variants: {
    color: {
      primary: BASE + "bg-blue-500 text-white hover:bg-blue-600",
      secondary: BASE + "bg-green-500 text-white hover:bg-green-600",
      red: BASE + "bg-red-500 text-white hover:bg-red-600",
    }
  }
});