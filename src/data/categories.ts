export interface CategoryItem {
  id: string;
  label: string;
  image?: string;
  icon?: string;
  type: 'food' | 'service';
  target?: string; // Para redirigir a categorías de encargos
}

export const CATEGORIES: CategoryItem[] = [
  {
    id: 'encebollado',
    label: 'Encebollado',
    image: 'https://lh3.googleusercontent.com/aida/ADBb0uinCThoWjkEU3_LTG_qP75gOj0lvB7oum7tDuf1ilLkG3xdrAAxWkB-ROEaGe3laqxkZfQf-f1_JWwjiuo5asD9mJi2wbuXC96o20vpxm2JW4QLkoLPXUIYjBrxshNWDfdrhhdLpxY_2jSS5WA8PlT3wkmbZA63OYuOTBgCnUhU0JWmg5BxtGcRaNhUT1xu3uSX5cKGWttN5ZJT0fa9cG3ui4axhGZTUgAT9a0cAPi5a7bPfG5wDP4AGXk',
    type: 'food'
  },
  {
    id: 'ceviche',
    label: 'Ceviche',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAghYZpc-ZO3U6EIQKVcrYQ3DENOkufFNFEJxVmwxRFyWuuxdMudk0CpGowiFF_0Zlpyo6DkGIJOO4_-kO-CyhCb11BjP1jKVAHsiUSl8XkYrItWIWRvL-G2fqQsEgdvBUExnK_1dRTUyJGcFOMIEMGGpjOZceiX7N1mmd-rpqlXXfUJQj-egt2HadoMjVzbEBKrjVPoq8bfJit9UiUpM-GO0I7rSqM1yfrsy9uYxD_YXdQ1Kci2-GV1IAHgFQJ__wodd-PcBkRuHE',
    type: 'food'
  },
  {
    id: 'bolon',
    label: 'Bolón',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDxsoeNKC07rsng5dU-t9dob3YGbmLoSmcfKAu6h0kEZGMdpCEtpz6nG-Nill5AR511sIrqlgUh4-n6l7mR-l8vR40tR-fRrm8MiPfJdosHfIlRApBe1eysJrjtWvyE-HItV8XuYFBZGxAv4rhw0RHE7wnqqIsr2LGlAdl5EjkbybALz_jfMve0a4QxD2q3LYDxWZ174kVG1t04kuYBbfsqFNbsXYjKYgq1BovDVB7TbUFhXeEGIJJP2NGail3BiusdMTLqdoWXudI',
    type: 'food'
  },
  {
    id: 'fritada',
    label: 'Fritada',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCti3MqaDieKc_AtgigkqDyKv3C-NTaP3gmBcuVG8uDOPofe9LnYC5D8dCjlI6NrQjqkv3IUaBMkgI3zoJPOKQgUdAfMSnItYo_Z0GpE5sQEpmX67hA5CXYnTVDNh-NQqhR-CH95FdUuVR2hyk0TjAgdk-VqNvU9U9nvBzzzIgMCW_MLLIPYen-Iw9rJlYs1FTR4Q-f_9hxZZRCOXNoRGzpLIBR1ryhn8SrIEzm7vGQqUjeEB0iBF3CD6NeuHRp8vTWLcpZM6X17HQ',
    type: 'food'
  },
  {
    id: 'chaulafan',
    label: 'Chaulafán',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCSVVxRKcY9i9BWpDcqJYR7FOhlCzR53z9hP2AK9_wFWN2FzFcsC7OcnRCbegt936TZ6hEsT31w_BK0gELZIYWb5hc-LatOHgcxW_2rUYir-4CsW8rMTnFKPMaEDiqlR5kM9QH59m9QhkdefAanXUnuyIQWhqj-RIyxki0cm9TFWFR41nEoU9uJ8O376GxnCsNs481DHC5DmGjNNdA5gENFfUmDH6CqbLJvaK1YzcF9DLxG4G93y6upO3pusoZ_Newln0kO7kRrUFs',
    type: 'food'
  },
  {
    id: 'bandeja',
    label: 'Bandeja',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAHK6LLYKfGggAQJpL-T09Yb2mYzYWtB8boY7mM4ds6lacTwDWcuuOoliFE9gJkyCSmk7rsLTSviZCPHbv8Y7Qs9LbziaXiT0Fg3Gt15kmIkGPaIVCNIxYzN6xw0U1xeelwKfW1BLIFKwDmm_SxEdX-rUuSReMBD1hV6l69p2zDeQ_TXA2qiq_6v63EbeGUC8i-tnc4wFWtkxIGlYRTLaXaAS75lpN_bdbBJVyhl4qsnsArNCWkId-ch9aMC52fZzj8b6z5fYXPI0s',
    type: 'food'
  },
  {
    id: 'arroz-con-pollo',
    label: 'Arroz con Pollo',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC4M1MbH38OzsjdejiA7HnmQuA_BwajTk8vxBzf-0jubROkuaNfTaD_rMNlONEpOKuqHpDce6SklTIW9frUGnrVSaXtMH-TGkUcfJHhH4ZiCK3S3bjCcouUTrTUZcEbiXubbmf59-ATSGqyB_9siHtSwKwmjfhnf6PvT88NyvB-ur9zzYUkVICcrlN9GpTRh-yY7lojqF4N2RnPt_AmsTOEIxu9Vr5e7UUHfJCkls4z0pFVYlp2Fy6xTONqj9Ey4WOJPf2sNdbl30o',
    type: 'food'
  },
  {
    id: 'sancocho',
    label: 'Sancocho',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDhE-x34Dwd5M5UCZNoFl2faOJYVHVuqMLjopM55KyXc-U_Sof8PBpzc_dIjXZxVmHEfrxc-aikhJ6Rax6phoi-37fQOjxtwLnPv-UsjYA1bnh-L7tiNe_mjvDEGeeA1Xw73BbJkCXv-rGFc1senyCWS6d6XJbOd9T6USlOAjQmEa6CDpdzytLhwLGv5LjUB_kTGq9FobneTw_qTFTqR9o6QQ-mmmsnYLdvjdZcxLiRYxEX6-AnAkM4IOTdy1ky1syYw8OcRXdqk4E',
    type: 'food'
  },
  {
    id: 'empanadas',
    label: 'Empanadas',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDvjMIddL5I3LeHETt7Q5OA2PP3s9TAGcNif9Ssr7LlFWlBpVxMiTXS7anaOc2zdiPrgBFttUYhFICDdJDyM6n58gTsweTgatQYo5osixfK4Rp-I5wImpCakYMHjFKGy6RUpb9EigmmPhJiHPKYU5b7mSn87Xr5p3bOpk3nISOT51VNPvtJnCGY9SP6x-KkrTGrrHqJlYbJsWZRz79GiFiJ8q531h7j3Y_kRJY5PYy3XzEWx2Tu6VP69dZ26wwAQPZOq-h7NCUBkPM',
    type: 'food'
  },
  {
    id: 'pizzas',
    label: 'Pizzas',
    image: 'https://lh3.googleusercontent.com/aida/ADBb0uiUGdTJDOUU15N4mq7eSy-3s1pbyPR6Qmi4SSpzLHYAyZnk03J-cIH1huRp5D41Wp9PRd7dpD4G1eFgsPv8q5htyQJvaTY0h-onhuXNCgyCaYkt_we54RGxsOgpCJHiFcUqsIp5Kq3aCI8_fqmqywh2jIKWlPUMVk3TTxeMIwfQuSOvyceljGlCJXcsgTuKxdQ58rqkZnqHZLo0QyBHkAf-8AkBMsqJTqUyGsjdY7RuPCEdLS5Nj07vBQ',
    type: 'food'
  },
  {
    id: 'hamburguesas',
    label: 'Hamburguesas',
    image: '/hamburguesas.png',
    type: 'food'
  },
  {
    id: 'postres',
    label: 'Postres',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBP9HYPMW6Qqj_po_OaZ6vCRUFYLjhK3yOGOsTb3F-Dq33EouHRvARj_TuNsUaPKDUe-LGdpb4MlTts3EjPgOD9W_9yf6G0GKdCRcBkwJN3zwctN-1TwzrD-K0fQXVkKIHwiqJCY3xs0em7VZlY1C5GcIy-tc3jjs-QVghinZX1S9oJxqaAS4gt3fZYwL4UlCkHa00DCQYx_hKtxLTRblclmL7FCTnuTU13WM96Z9nHV3tb4jJ_tNFca1cpg9cFVVwC1ePetxUOB64',
    type: 'food'
  },
  {
    id: 'bebidas',
    label: 'Bebidas',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGiwxrCdvYfrNyVnu_p4KcJm11hJCPqktGzm3UVlHIp3xJZH8Trjh7c7-jE88T3Xf6n1ZEaD6CesTlRymuT8W9TTSGL2BlxsxY5lv6HJvrVfF5OQXlnJE2_hITnsK-DH7U-PuskxA-4Xu3FdO87gcHGna2gVVogtDTAI5D4XsQm8YizgAEyegsjFHp0PS65AhMrBgX5UfHnIejkSnlIsw6-KptUxYZMCl1qX1xmMsEVOUXDT236siphzLtXY1ToHk3WcvMNIE1flo',
    type: 'food'
  },
  {
    id: 'saludable',
    label: 'Saludable',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZGx43oydCPSS81Zd6BBqINAtujJ7AQtidp1FACGN5sw1i98N2O8_I0xEvCeSGFVwE7prSUwXkmBcyinAE9aUmliEUAjFh2wrNvaC36RN39_u6sNw2MGknBXIwMmpGCeJatZJM-WDXMzWsKz92jhe3bZYCJdx8SA7beRaXgqBO0fDplF7Ard7KmfvRW0wcACkvFf-c27BMoTyAiju9IAZKjM0BhTsAwkNVvnHPe3cJRY_DQ2HN0QwWWaU1XSRVnoZxhce5VeSXrNw',
    type: 'food'
  },
  {
    id: 'super',
    label: 'Súper',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLZ_o2eV0GTB1DGtzfHxrD-tJqMz1wKVCsu8k4f97WchtrEeWpJdoXDYEZC7i8fRYOFOd0SLWUtCmCZxoC8VuuSR7UfQIRqW33gXmxNbnpD1p-n9kIvUKEkpqwQgJcyvzCzAAi-QWiIfhybpUdxjlQ-lalB3ZZ40PKVa3H0_OXsi1Fwr2uFEyLwqvIdluK7jXGIQBxd5_catbJBuxz9rEscj4FAS7b5dFTM71tW3817E21j-3bobFo9lewuJbuyxDhUgP15xgdrec',
    type: 'service',
    target: 'otro'
  },
  {
    id: 'farmacia',
    label: 'Farmacia',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLb65FFa-qM8hETyaA-38SPtNzE3FXTFlQeuHOlOVIWkwQ06wRq2S_FpqRHNQZGIOiHrRSm2lRY6XEb9Lm35pe2jgJFSkmlP0-oRZxA3vHsS1FPWsBJ0nFO37KJe5snTjMG60TV2-hbFNIl81yEJvQXlBxKIBAtqtCUzZsgpC0jhztEcGnh_ompkkA-LpSplrNdsppVO_ecIjNRkbPw4ASpsHfNF2HeYwUrUYybTqIc9cyAw8fZ4w1vmawoVqib6Z5W4cge1JFiso',
    type: 'service',
    target: 'medicina'
  }
];
